import { GmailService } from "./gmail.service";
import { TokenStoreService } from "src/utils/token.store";
import { Controller, Get, NotFoundException, Query } from "@nestjs/common";


@Controller('test-gmail')
export class GmailTestController{
    constructor(
        private gmailService: GmailService,
        private tokenStore: TokenStoreService, 
    ){}

    @Get()
    async testGmail(@Query('refresh_token') refresh_token:string){
        const token = await this.tokenStore.get(refresh_token);

        if(!token){
            throw new NotFoundException('No refresh token found');
        }

        const result = await this.gmailService.scanEmails(token);

        return {
            message: `Found and processed ${result.length} emails`,
            data: result.map(res => ({
                subject:res.subject,
                from: res.from,
                invoiceNumber: res.invoiceNumber,
                attachments: res.attachments?.map(a => a.filename), 
            }))
        };
    }
}