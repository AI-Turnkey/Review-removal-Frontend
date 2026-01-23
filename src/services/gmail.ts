import { google } from 'googleapis';
import { getOAuth2Client } from './googleSheets';
import { config } from '../config/env';

// Get Gmail API instance
function getGmailApi() {
  const auth = getOAuth2Client();
  return google.gmail({ version: 'v1', auth });
}

/**
 * Create a Gmail draft
 * @param subject - Email subject
 * @param htmlBody - Email body in HTML format
 * @returns The draft ID
 */
export async function createDraft(subject: string, htmlBody: string, fromName?: string): Promise<string> {
  const gmail = getGmailApi();

  try {
    // Create the email message
    const headers = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
    ];

    if (fromName) {
      headers.push(`From: "${fromName}" <${config.gmail.userEmail}>`);
    }

    headers.push(''); // Empty line before body
    headers.push(htmlBody);

    const message = headers.join('\n');

    // Encode the message in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Create the draft
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });

    console.log(`Created draft: ${response.data.id}`);
    return response.data.id || '';
  } catch (error) {
    console.error('Error creating Gmail draft:', error);
    throw error;
  }
}
