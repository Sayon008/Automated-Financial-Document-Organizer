import { Controller, Get, Query, Redirect} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService : AuthService){}

    @Get('/google')
    @Redirect()
    googleAuth(){
        const url = this.authService.generateAuthUrl();
        return {url};
    }

    @Get('/google/callback')
    async googleAuthCallback(@Query('code') code: string){
        const token = await this.authService.getTokens(code);
        return {token};
    }
}
