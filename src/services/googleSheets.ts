import { google } from 'googleapis';
import { config } from '../config/env';

// Create OAuth2 client
function getOAuth2Client() {
  if (!config.google.clientId || !config.google.clientSecret || !config.google.refreshToken) {
    console.error('❌ Missing Google OAuth credentials in environment variables');
    throw new Error('Missing Google OAuth credentials');
  }

  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: config.google.refreshToken,
  });

  return oauth2Client;
}

// Get Google Sheets API instance
function getSheetsApi() {
  const auth = getOAuth2Client();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Read all rows from a Google Sheet
 */
export async function getSheetRows(sheetId: string, sheetName: string = 'Sheet1'): Promise<Record<string, any>[]> {
  const sheets = getSheetsApi();

  try {
    // First, get the header row
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] || [];
    if (headers.length === 0) {
      return [];
    }

    // Get all data rows
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!2:10000`, // Get rows 2 onwards
    });

    const rows = dataResponse.data.values || [];

    // Convert to array of objects
    return rows.map((row) => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error('Error reading sheet:', error);
    throw error;
  }
}

/**
 * Append rows to a Google Sheet
 */
export async function appendToSheet(
  sheetId: string,
  rows: Record<string, any>[],
  sheetName: string = 'Sheet1'
): Promise<void> {
  if (rows.length === 0) return;

  const sheets = getSheetsApi();

  try {
    // Get headers from sheet
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] || [];
    if (headers.length === 0) {
      throw new Error('Sheet has no headers');
    }

    // Convert objects to rows based on headers
    const values = rows.map((row) =>
      headers.map((header) => row[header] ?? '')
    );

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw error;
  }
}

/**
 * Update a specific row in a Google Sheet by matching a column value
 */
export async function updateSheetRow(
  sheetId: string,
  matchColumn: string,
  matchValue: string,
  updateData: Record<string, any>,
  sheetName: string = 'Sheet1'
): Promise<void> {
  const sheets = getSheetsApi();

  try {
    // Get headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!1:1`,
    });

    const headers: string[] = headerResponse.data.values?.[0] || [];
    const matchColumnIndex = headers.indexOf(matchColumn);
    if (matchColumnIndex === -1) {
      throw new Error(`Column '${matchColumn}' not found`);
    }

    // Get all data
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`,
    });

    const allRows = dataResponse.data.values || [];

    // Find the row to update (skip header)
    let rowIndex = -1;
    for (let i = 1; i < allRows.length; i++) {
      if (allRows[i][matchColumnIndex] === matchValue) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      console.warn(`Row with ${matchColumn}='${matchValue}' not found`);
      return;
    }

    // Prepare updated row
    const currentRow = allRows[rowIndex];
    const updatedRow = headers.map((header, index) => {
      if (updateData.hasOwnProperty(header)) {
        return updateData[header];
      }
      return currentRow[index] || '';
    });

    // Update the specific row
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A${rowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow],
      },
    });
  } catch (error) {
    console.error('Error updating sheet row:', error);
    throw error;
  }
}

/**
 * Create a new template sheet with the required headers
 */
export async function createTemplate(): Promise<string> {
  const sheets = getSheetsApi();

  try {
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'TurnKey Review Removal Template',
        },
      },
    });

    const spreadsheetId = response.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create template spreadsheet');
    }

    // Add headers
    const headers = [
      'Date',
      'Author',
      'Verified',
      'Helpful',
      'Title',
      'Body',
      'Rating',
      'Images',
      'Videos',
      'URL',
      'Variation',
      'Style',
      'Comment is correct or not ',
      'email '
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    return spreadsheetId;
  } catch (error) {
    console.error('Error creating template sheet:', error);
    throw error;
  }
}

export { getOAuth2Client };
