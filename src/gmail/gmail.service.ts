import { Injectable, Logger } from '@nestjs/common';
import { Auth, gmail_v1, google } from 'googleapis';
import { AuthService } from 'src/auth/auth.service';
import { GmailMessage } from './gmailMessage.interface';


@Injectable()
export class GmailService {

    private logger = new Logger(GmailService.name);

    private SEARCH_KEYWORDS:string[] = ['invoice', 'receipt', 'bill'];

    private LABEL_NAME = 'AUTO_PROCESSED';

    private ALLOWED_SENDERS : string[] = [];


    constructor(
        private authService: AuthService,
    ){}

    

    async scanEmails(creds: Auth.Credentials): Promise<GmailMessage[]>{
        // Get the authetication client for the token
        const authClient = await this.authService.getAuthenticatedClientForUser(creds);

        // Initialize gmail api with the authenticated client
        const gmail = google.gmail({version: 'v1', auth: authClient});

        // Chekc if the label exist or create it
        const lableId = await this.ensureLabel(gmail);

        // Build the gmail serach query
        const query = await this.buildSearchQuery();

        // Using the search query find the matching email id's
        const messageIds = await this.searchEmailIds(gmail, query);

        const result : GmailMessage[] = [];

        for(const id of messageIds){
            // Fetch the full email data
            try{
                const message = await gmail.users.messages.get({
                    userId:'me',
                    id,
                    format:'full',
                });

                const headers = message.data.payload?.headers || [];

                // extract the subject, from email and date
                const subject = this.getHeaders(headers, 'Subject');
                const from = this.getHeaders(headers, 'From');
                const date = this.getHeaders(headers,'Date');

                // Get the invoice number from the subject 
                const invoiceNumber = this.extractInvoiceNumber(subject);

                // debugger
                this.logger.log(`Found email: "${subject}" from: ${from} on ${date}`);

                // Extract the attachment file
                const attachments = await this.getFinancialAttachments(gmail, (await message).data);

                // If the attachments are present then after downloading it mark the email as processed
                if(Array.isArray(attachments) && attachments?.length > 0){
                    await gmail.users.messages.modify({
                        userId:'me',
                        id,
                        requestBody : {addLabelIds: [lableId]},
                    });


                    result.push({
                        id,
                        subject,
                        from,
                        date,
                        invoiceNumber,
                        attachments
                    });

                    this.logger.log(`Processed email: ${subject}`);
                }
            }
            catch (error) {
                this.logger.warn(`Failed processing email ${id}: ${error.message}`);
                continue;
            }
        }

        return result;

    }

    // Gmail label exists or not. If not create it

    private async ensureLabel(gmail:gmail_v1.Gmail):Promise<string>{
        const res = await gmail.users.labels.list({userId:'me'});

        const label = res.data.labels?.find((label) => label.name === this.LABEL_NAME);

        // If the label already exist return its id
        if(label){
            return label.id!;
        }

        // if it doesn't exist , create the label
        const created = await gmail.users.labels.create({
            userId:'me',
            requestBody:{
                name:this.LABEL_NAME,
                labelListVisibility: 'labelShow',
                messageListVisibility:'show',
            },
        });

        return created.data.id!;
    }


    // Gmail search query - filter the gmails based on-
    // - SEARCH_KEYWORDS
    // - ALLOWED_SENDERS
    // - Not yet labeled - AUTO_PROCESSED

    async buildSearchQuery(): Promise<string>{
        const keywordPart = this.SEARCH_KEYWORDS.map(keyword => `subject:${keyword}`).join(' OR ');

        const senderPart = this.ALLOWED_SENDERS.map(sender =>  `from:${sender}`).join(' OR ');

        const excludeLablePart = `-label:${this.LABEL_NAME}`;

        const hasAttachments = `has:attachment`

        const queryParts =  [keywordPart, senderPart, excludeLablePart, hasAttachments].filter(Boolean);

        const query = queryParts.join(' ');

        this.logger.log('[GmailService] final search query: ' + query);

        return query;
    }


    // Search for the email id's accroding to the search query
    private async searchEmailIds(gmail: gmail_v1.Gmail, query:string): Promise<string[]>{
        const ids: string[] = [];
        let pageToken: string | undefined = undefined;
        
        do{
            const res = gmail.users.messages.list({
                userId:'me',
                q: query,
                maxResults: 50,
                pageToken
            });

            const batch = (await res).data.messages?.map(m => m.id!).filter(Boolean) || [];
            ids.push(...batch);
            pageToken = (await res).data.nextPageToken;
        }
        while(pageToken);
        
        return ids;
    }


    // Extracting the invoice number from the subject of the email
    private extractInvoiceNumber(subject: string): string | undefined{
        const match = subject.match(/\b\d{4,}\b/);
        return match? (match[0]) : undefined;
    }

    // Check the emails for attachments like PDF/images
    private async getFinancialAttachments(gmail:gmail_v1.Gmail, message: gmail_v1.Schema$Message): Promise<GmailMessage['attachments']>{

        const parts = message.payload?.parts || [];

        const attachments : GmailMessage['attachments'] = [];

        for(const part of parts){
            const filename = part.filename;
            const attachmentId = part.body?.attachmentId;

            // If no attachments are there then skip the email and continue
            if(!filename || !attachmentId){
                continue;
            }

            // Downloading the attachment using the gmail api
            const res = await gmail.users.messages.attachments.get({
                userId:'me',
                messageId:message.id!,
                id: attachmentId
            });

            const data = res.data.data;

            if(data){
                attachments.push({
                    filename,
                    data: Buffer.from(data, 'base64'),
                });
            }
        }

        // console.log('Checking parts:', message.payload?.parts);

        return attachments;
    }

    private getHeaders(headers:gmail_v1.Schema$MessagePartHeader[], name:string): string{
        return headers.find(h => h.name === name)?.value || '';
    }
}
