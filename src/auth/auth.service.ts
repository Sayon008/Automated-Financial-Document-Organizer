import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import type {ConfigType } from '@nestjs/config';
import { Auth, google } from 'googleapis';
import googleOauthConfig from 'src/config/google-oauth.config';
import { TokenStoreService } from 'src/utils/token.store';

@Injectable()
export class AuthService {
    private oauth2Client: Auth.OAuth2Client;

    private logger = new Logger(AuthService.name);

    constructor(
        @Inject(googleOauthConfig.KEY)
        private googleConfig: ConfigType<typeof googleOauthConfig>,
        private tokenStore: TokenStoreService,
    ){}

    private createOAuthClient():Auth.OAuth2Client{
        return new google.auth.OAuth2(
            this.googleConfig.clientID,
            this.googleConfig.clientSecret,
            this.googleConfig.redirectURL,
        )
    }


    generateAuthUrl(){
        const scopes = [
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/gmail.labels',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
        ]

        return this.createOAuthClient().generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
        });
    }


    async getTokens(code: string): Promise<Auth.Credentials>{
        const client = this.createOAuthClient();
        try{
            const {tokens} = await client.getToken(code);

            client.setCredentials(tokens);

            // warning - refresh token is missing
            if (!tokens.refresh_token) {
                this.logger.warn(`No refresh token received`);
            }

            // Store tokens in-memory using refresh_token as key
            if(tokens.refresh_token){
                await this.tokenStore.save(tokens.refresh_token, tokens);
                this.logger.log('Tokens saved in-memory.');
            }

            return tokens;
        }
        catch(error){
            console.error('Failed to get the token:', error.message);
            throw new InternalServerErrorException('Google Authentication Failed!');
        }
    }

    // setStoredTokens(token:Auth.Credentials){
    //     const client = this.createOAuthClient();
    //     client.setCredentials(token);
    // }



    // Get authenticated client for a particular user with proper tokens
    async getAuthenticatedClientForUser(creds:Auth.Credentials): Promise<Auth.OAuth2Client>{

        if(!creds || !creds.access_token){
            throw new Error(`Tokens not found for the user`);
        }

        const client = this.createOAuthClient();

        client.setCredentials(creds);

        // Refresh toke automatically when get expired
        client.on('tokens', async (newCreds)=> {
            this.logger.log(`Token refreshed for user`, newCreds);


            const updatedTokens : Auth.Credentials = {
                ...creds,
                ...newCreds
            };

            const refreshKey = updatedTokens.refresh_token ?? creds.refresh_token;

            // Storing updated refresh token in-memory
            if(refreshKey){
                await this.tokenStore.save(refreshKey, updatedTokens);
                this.logger.log('Refreshed tokens updated in-memory.');
            }
            else{
                this.logger.warn('No refresh_token to save refreshed credentials.');
            }
        })

        return client;
    }
}
