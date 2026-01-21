import OpenAI from 'openai';
import { config } from '../config/env';
import { EMAIL_SYSTEM_PROMPT, generateEmailUserPrompt } from '../prompts/emailPrompt';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

export interface EmailContent {
  subject: string;
  body: string;
}

/**
 * Generate an email draft for a non-compliant review
 * @param reviewBody - The review text
 * @param reviewUrl - The URL of the review
 * @param asin - The ASIN of the product
 * @param brandName - The brand name
 * @returns The generated email subject and body
 */
export async function generateEmail(
  reviewBody: string,
  reviewUrl: string,
  asin: string,
  brandName: string
): Promise<EmailContent> {
  const openai = getOpenAIClient();

  try {
    const userPrompt = generateEmailUserPrompt(reviewBody, reviewUrl, asin, brandName);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: EMAIL_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const rawText = response.choices[0]?.message?.content || '';
    return parseEmailContent(rawText);
  } catch (error) {
    console.error('Error generating email:', error);
    throw error;
  }
}

/**
 * Parse the AI response to extract subject and body
 * This mirrors the logic from the n8n Code in JavaScript4 node
 */
function parseEmailContent(rawText: string): EmailContent {
  // Normalize line breaks
  const formattedText = rawText.replace(/\\n/g, '\n');

  // Extract subject using various patterns
  let subject = 'Request for Removal of Non-Compliant Customer Reviews';
  let subjectEndIndex = 0;

  // Pattern 1: **Subject:** followed by content in backticks
  let subjectMatch = formattedText.match(/\*\*Subject:\*\*\s*\n?\s*`([^`]+)`/);

  // Pattern 2: **Subject:** followed by content on next line
  if (!subjectMatch) {
    subjectMatch = formattedText.match(/\*\*Subject:\*\*\s*\n\s*(.+?)(?=\n\n|\nDear|\n\*\*)/);
  }

  // Pattern 3: Subject: without asterisks
  if (!subjectMatch) {
    subjectMatch = formattedText.match(/Subject:\s*\n?\s*(.+?)(?=\n\n|\nDear|\n\*\*)/);
  }

  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    subjectEndIndex = formattedText.indexOf(subjectMatch[0]) + subjectMatch[0].length;
  }

  // Extract body
  let body = formattedText.slice(subjectEndIndex).trim();

  // Clean up the body
  body = body
    .replace(/^\*\*Subject:\*\*[^\n]*\n?/gm, '')
    .replace(/^Subject:[^\n]*\n?/gm, '')
    .replace(/^`+|`+$/g, '')
    .replace(/^\n+/, '')
    .trim();

  // If body still starts with the subject text, remove it
  if (body.startsWith(subject)) {
    body = body.slice(subject.length).trim();
  }

  // Convert newlines to HTML breaks for Gmail
  const emailBodyHtml = body.replace(/\n/g, '<br>');

  return {
    subject,
    body: emailBodyHtml,
  };
}
