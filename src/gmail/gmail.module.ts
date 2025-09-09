import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailTestController } from './gmail.controller.specs';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    AuthModule,
  ],
  controllers:[GmailTestController],
  providers: [GmailService],
  exports:[GmailService]
})
export class GmailModule {}
