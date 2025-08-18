import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import googleOauthConfig from './config/google-oauth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      load: [googleOauthConfig],
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
