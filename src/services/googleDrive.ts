import { google } from 'googleapis';
import { config } from '../config/env';
import { getOAuth2Client } from './googleSheets';

// Get Google Drive API instance
function getDriveApi() {
  const auth = getOAuth2Client();
  return google.drive({ version: 'v3', auth });
}

/**
 * Copy a file in Google Drive
 * @param fileId - The ID of the file to copy
 * @param newName - The name for the copied file
 * @returns The ID of the new file
 */
export async function copyFile(fileId: string, newName: string): Promise<string> {
  const drive = getDriveApi();

  try {
    const requestBody: any = {
      name: newName,
    };

    // Add parent folder if configured
    if (config.google.driveFolderId) {
      requestBody.parents = [config.google.driveFolderId];
    }

    const response = await drive.files.copy({
      fileId,
      requestBody,
    });

    return response.data.id || '';
  } catch (error) {
    console.error('Error copying file:', error);
    throw error;
  }
}

/**
 * Copy the template sheet for a new file upload
 * @param fileName - The name from the uploaded file (without extension)
 * @returns The ID of the new sheet
 */
export async function copyTemplateSheet(fileName: string): Promise<string> {
  return copyFile(config.google.templateSheetId, fileName);
}
