import { Module } from '@nestjs/common';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { UtilsModule } from 'src/utils/utils.module';
import { GmailModule } from 'src/gmail/gmail.module';
import { DriveModule } from 'src/drive/drive.module';
import { SheetModule } from 'src/sheet/sheet.module';

@Module({
  imports:[
    AuthModule,
    UtilsModule,
    GmailModule,
    DriveModule,
    SheetModule,
  ],
  controllers: [ScanController],
  providers: [ScanService]
})
export class ScanModule {}
