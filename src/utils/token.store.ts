import { Injectable } from "@nestjs/common";
import { Auth } from "googleapis";

@Injectable()
export class TokenStoreService{
    private tokenMap: Map<string, Auth.Credentials> = new Map();

    async save(refreshToken : string, creds: Auth.Credentials):Promise<void>{
        console.log(`Saving tokens under key: ${refreshToken}`);
        this.tokenMap.set(refreshToken, creds);
    }

    async get(refreshToken:string):Promise<Auth.Credentials | undefined>{
        console.log(`Attempting to retrieve token for key: ${refreshToken}`);
        return this.tokenMap.get(refreshToken);
    }

    async delete(refreshToken:string): Promise<void>{
        this.tokenMap.delete(refreshToken);
    }
}



// Storing only the refresh and access token in the memory doesnot works
// as we need a object to refresh the access token after certain period of time  
// 🛑 But Keep in Mind
// ⚠️ This setup is now NOT suitable for auto-refreshing expired access tokens, because:

// You're not storing refresh_token → Google can’t use it to get a new access_token
// You're not tracking expiry_date → Can’t warn user before access token expires
// If access_token is expired → Gmail API will return 401 Unauthorized