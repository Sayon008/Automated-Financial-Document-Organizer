import { Module } from '@nestjs/common';
import { SheetService } from './sheet.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  providers: [SheetService,AuthService],
  exports:[SheetService]
})
export class SheetModule {}
