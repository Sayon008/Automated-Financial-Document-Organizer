import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Auth, google } from 'googleapis';
import { AuthService } from 'src/auth/auth.service';
import googleSheetConfig from 'src/config/google-sheet.config';
import { GoogleSheetInputs } from './sheet-inputs.interface';

@Injectable()
export class SheetService {

    private logger = new Logger(SheetService.name);
    
    constructor(
        @Inject(googleSheetConfig.KEY)
        private sheetConfig: ConfigType<typeof googleSheetConfig>,
        private authService: AuthService,
    ){}

    async addDetailsInGoogleSheet(creds: Auth.Credentials, sheetInput:GoogleSheetInputs):Promise<void>{

        const authClient = await this.authService.getAuthenticatedClientForUser(creds);

        const sheets = google.sheets({version:'v4', auth:authClient});

        const spreadsheetId = this.sheetConfig.sheetId;

        if(!spreadsheetId){
            throw new NotFoundException(`Missing GOOGLE_SHEET_ID in environment variables. Please set it in .env.`);
        }

        const values = [
            [
                sheetInput.sender,
                sheetInput.subject,
                sheetInput.date,
                sheetInput.invoiceNumber,
                sheetInput.fileId
            ]
        ];


        const request = {
            spreadsheetId,
            range:'Sheet1!A1',
            valueInputOption : 'RAW',
            requestBody : {
                values,
            }
        };

        await sheets.spreadsheets.values.append(request);


        this.logger.log(`Appended row to sheet: [${sheetInput.sender}, ${sheetInput.subject}, ${sheetInput.date}, ${sheetInput.invoiceNumber}, ${sheetInput.fileId}]`);
    }
}
