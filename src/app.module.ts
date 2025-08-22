import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import googleOauthConfig from './config/google-oauth.config';
import { GmailModule } from './gmail/gmail.module';
import { UtilsModule } from './utils/utils.module';
import { DriveModule } from './drive/drive.module';
import { ScanModule } from './scan/scan.module';
import { SheetModule } from './sheet/sheet.module';
import googleDriveConfig from './config/google-drive.config';
import googleSheetConfig from './config/google-sheet.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      load: [googleOauthConfig, googleDriveConfig,googleSheetConfig],
    }),
    ScanModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
