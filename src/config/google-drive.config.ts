import { registerAs } from "@nestjs/config";

export default registerAs('driveConfig', () => ({
    rootFolderId : process.env.DRIVE_FOLDER_ID,
}));