
import { google } from 'googleapis';
import { config, validateEnv } from './src/config/env';
import { getOAuth2Client } from './src/services/googleSheets';

// Validate env to ensure we have credentials
validateEnv();

async function createTemplateSheet() {
    console.log('🚀 Creating new Template Sheet...');

    const auth = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // 1. Create new spreadsheet
        const createResponse = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: 'TurnKey Review Removal Template',
                },
            },
        });

        const spreadsheetId = createResponse.data.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error('Failed to create spreadsheet');
        }

        console.log(`✅ Spreadsheet created with ID: ${spreadsheetId}`);

        // 2. Add headers
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

        console.log('✅ Headers added successfully');
        console.log('\nCopy this ID to your .env file:');
        console.log(`GOOGLE_TEMPLATE_SHEET_ID=${spreadsheetId}`);

    } catch (error) {
        console.error('❌ Error creating template sheet:', error);
        process.exit(1);
    }
}

createTemplateSheet();
