import { registerAs } from "@nestjs/config";

export default registerAs('googleSheet', () => ({
    sheetId : process.env.SHEET_ID,
}));