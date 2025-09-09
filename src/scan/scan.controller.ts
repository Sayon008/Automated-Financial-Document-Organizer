import { Body, Controller, Post, Query, Redirect } from '@nestjs/common';
import { ScanService } from './scan.service';

@Controller('scan')
export class ScanController {
    constructor(private scanService : ScanService){}

    @Post()
    async scanAndUpload(@Body('refreshToken') refreshToken: string){
        return this.scanService.scanAndProcess(refreshToken);
    }
}