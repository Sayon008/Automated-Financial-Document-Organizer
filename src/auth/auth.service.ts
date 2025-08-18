import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import type {ConfigType } from '@nestjs/config';
import { Auth, google } from 'googleapis';
import googleOauthConfig from 'src/config/google-oauth.config';

@Injectable()
export class AuthService {
    private oauth2Client: Auth.OAuth2Client;

    constructor(
        @Inject(googleOauthConfig.KEY)
        private googleConfig: ConfigType<typeof googleOauthConfig>,
    ){
        this.oauth2Client = new google.auth.OAuth2(
            this.googleConfig.clientID,
            this.googleConfig.clientSecret,
            this.googleConfig.redirectURL,
        );
    }


    generateAuthUrl(){
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
        ]

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
        });
    }


    async getTokens(code: string): Promise<Auth.Credentials>{
        try{
            const {tokens} = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            return tokens;
        }
        catch(error){
            console.error('Failed to get the token:', error);
            throw new InternalServerErrorException('Failed to get the token!');
        }
    }
}
