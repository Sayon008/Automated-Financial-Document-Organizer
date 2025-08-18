import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleAuth(): {
        url: string;
    };
    googleAuthCallback(code: string): Promise<{
        token: import("google-auth-library").Credentials;
    }>;
}
