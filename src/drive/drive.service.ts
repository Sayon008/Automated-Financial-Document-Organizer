import { Inject, Injectable, Logger } from '@nestjs/common';
import { Auth, drive_v3, google } from 'googleapis';
import { DriveUploadInput } from './driveUpload.interface';
import { AuthService } from 'src/auth/auth.service';
import { Readable } from 'stream';
import googleDriveConfig from 'src/config/google-drive.config';
import type {ConfigType } from '@nestjs/config';

@Injectable()
export class DriveService {
    private logger = new Logger(DriveService.name);

    constructor(
        @Inject(googleDriveConfig.KEY)
        private driveFolderSetting: ConfigType<typeof googleDriveConfig>,
        private authService:AuthService,
        // private gmailService:GmailService,
    ){}

    async uploadFile(creds:Auth.Credentials, file: DriveUploadInput): Promise<string>{

        // Get the authenticated client details for ths curr user
        const authClient = await this.authService.getAuthenticatedClientForUser(creds);

        // Create google drive api instance
        const drive = google.drive({version:'v3', auth:authClient});

        const date = new Date(file.date);
        const year = date.getFullYear().toString();
        const month = date.toLocaleString('default', {month:'long'});
        const monthFolder = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${month}`;


        // Create nested Folder with date and time
        const parentFolder = await this.ensureFolderStructure(drive, this.driveFolderSetting.rootFolderId!, [year,monthFolder]);

        // Create a readable stream from the Buffer
        const stream = new Readable();

        stream.push(file.buffer);
        stream.push(null);

        // Uploading the file to drive
        const response = await drive.files.create({
            requestBody:{
                name: file.filename,
                parents:[parentFolder]
            },
            media:{
                body:stream,
            },
            fields:'id',
        });


        const fileId = response.data.id;

        this.logger.log(`Uploaded to Drive: ${file.filename} Id: ${fileId}`);

        return fileId!;
    }

    private async ensureFolderStructure(drive: drive_v3.Drive, rootFolder: string, names:string[]) : Promise<string>{
        let parent = rootFolder;

        for(const name of names){
            const folderId = await this.getOrCreateSubFolder(drive, name, parent);

            parent = folderId;
        }

        return parent;
    }

    private async getOrCreateSubFolder(drive: drive_v3.Drive, name: string, parent: string):Promise<string>{
        const res = await drive.files.list({
            q: `'${parent}' in parents and name='${name}'  and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields:'files(id, name)',
            spaces:'drive',
        });

        const folder = res.data.files?.[0];

        if(folder){
            return folder.id!;
        }

        const folderMetaData = await drive.files.create({
            requestBody:{
                name,
                mimeType:'application/vnd.google-apps.folder',
                parents:[parent]
            },
            fields:'id',
        });

        this.logger.log(`Created folder: ${name} under parent: ${parent}`);

        return folderMetaData.data.id!;
    }

}
