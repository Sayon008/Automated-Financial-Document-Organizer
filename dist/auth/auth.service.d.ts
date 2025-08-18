import type { ConfigType } from '@nestjs/config';
import { Auth } from 'googleapis';
import googleOauthConfig from 'src/config/google-oauth.config';
export declare class AuthService {
    private googleConfig;
    private oauth2Client;
    constructor(googleConfig: ConfigType<typeof googleOauthConfig>);
    generateAuthUrl(): string;
    getTokens(code: string): Promise<Auth.Credentials>;
}
