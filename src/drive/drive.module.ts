import { Module } from '@nestjs/common';
import { DriveService } from './drive.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import googleDriveConfig from 'src/config/google-drive.config';

@Module({
  imports:[
    ConfigModule.forFeature(googleDriveConfig),
    AuthModule
  ],
  providers: [DriveService],
  exports:[DriveService]
})
export class DriveModule {}
