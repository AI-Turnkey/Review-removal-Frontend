import OpenAI from 'openai';
import { config } from '../config/env';
import { COMPLIANCE_SYSTEM_PROMPT } from '../prompts/compliancePrompt';

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

/**
 * Check if a review is compliant with Amazon guidelines
 * @param reviewBody - The review text to check
 * @returns 'yes' if compliant, 'no' if non-compliant
 */
export async function checkCompliance(reviewBody: string): Promise<'yes' | 'no'> {
  const openai = getOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: COMPLIANCE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: reviewBody,
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const result = response.choices[0]?.message?.content?.trim().toLowerCase();

    // Validate response is either 'yes' or 'no'
    if (result === 'yes' || result === 'no') {
      return result;
    }

    // Default to 'yes' (compliant) if unclear
    console.warn(`Unexpected AI response: "${result}", defaulting to "yes"`);
    return 'yes';
  } catch (error) {
    console.error('Error checking compliance:', error);
    throw error;
  }
}
