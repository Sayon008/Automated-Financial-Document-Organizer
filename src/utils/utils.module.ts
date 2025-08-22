import { Global, Module } from '@nestjs/common';
import { TokenStoreService } from './token.store';

@Global()
@Module({
  providers: [TokenStoreService],
  exports: [TokenStoreService],
})
export class UtilsModule {}