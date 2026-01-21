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
  try {
    // Try to copy the existing template
    return await copyFile(config.google.templateSheetId, fileName);
  } catch (error: any) {
    // If template not found or no access, create a new one
    if (error.code === 404 || error.status === 404 || error.message?.includes('not found')) {
      console.log('⚠️ Template sheet not found or inaccessible. Creating a new one...');
      const { createTemplate } = require('./googleSheets');
      const newTemplateId = await createTemplate();

      // Update config for this session (optional but helpful)
      config.google.templateSheetId = newTemplateId;

      // Copy the newly created template
      return await copyFile(newTemplateId, fileName);
    }
    throw error;
  }
}
