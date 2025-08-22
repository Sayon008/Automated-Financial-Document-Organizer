import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DriveService } from 'src/drive/drive.service';
import { GmailService } from 'src/gmail/gmail.service';
import { GmailMessage } from 'src/gmail/gmailMessage.interface';
import { TokenStoreService } from 'src/utils/token.store';
import { ScanUploadResults, ScanUploads } from './scan-uploads.interface';
import { DriveUploadInput } from 'src/drive/driveUpload.interface';
import { SheetService } from 'src/sheet/sheet.service';

@Injectable()
export class ScanService {

    private logger = new Logger(ScanService.name);

    constructor(
        private gmailService: GmailService,
        private driveService: DriveService,
        private tokenStore: TokenStoreService,
        private sheetService: SheetService
    ){}

    async scanAndProcess(refreshToken:string){
        const token = await this.tokenStore.get(refreshToken);

        if(!token){
            throw new NotFoundException('No token found for the user');
        }

        this.logger.log('Token Found, Starting Gmail Scan');

        // Finding and seperating emails wit attachments
        const emails : GmailMessage[] = await this.gmailService.scanEmails(token);

        if(emails.length === 0){
            this.logger.log('No sunch emails to process');
            throw new NotFoundException('No emails with attachments');
        }

        const uploads: ScanUploadResults[] = [];

        // Uploading to Drive
        for(const email of emails){
            if(!email.attachments || email.attachments.length === 0){
                continue;
            }

            for(const attachment of email.attachments){

                const uploadInput : DriveUploadInput = {
                    filename: attachment.filename,
                    buffer: attachment.data,
                    sender:email.from,
                    date:email.date
                }

                const fileId = await this.driveService.uploadFile(token, uploadInput);

                uploads.push({
                    subject:email.subject,
                    from:email.from,
                    fileName:attachment.filename,
                    fileId,
                });

                
                // Updating Google Sheets with details
                await this.sheetService.addDetailsInGoogleSheet(token, {
                    sender:email.from,
                    subject:email.subject,
                    date:email.date,
                    invoiceNumber:email.invoiceNumber ?? '',
                    fileId:fileId
                })


                this.logger.log(`Uploaded: ${attachment.filename} from "${email.subject}"`);
            }
        }

        return{
            message: `Scan complete. Processed ${emails.length} emails.`,
            uploadCount: uploads.length,
            uploads,
        }
    }
}
