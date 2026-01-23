import { Request, Response } from 'express';
import { extractSheetId } from '../utils/sheetIdExtractor';
import { getSheetRows, appendToSheet, updateSheetRow } from '../services/googleSheets';
import { copyTemplateSheet } from '../services/googleDrive';
import { createDraft } from '../services/gmail';
import { parseExcelBuffer, removeDuplicates, filterLowRatings, ReviewRow } from '../services/excel';
import { checkCompliance } from '../services/aiCompliance';
import { generateEmail } from '../services/aiEmailGenerator';
import { sendProgress } from '../services/progress';
import { config } from '../config/env';

interface WebhookRequest {
  type: 'link' | 'file';
  url?: string;
  brandName: string;
}

/**
 * Main webhook handler - processes both link and file submissions
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const { type, url, brandName } = req.body as WebhookRequest;
    const file = req.file;

    console.log(`\n📥 Received ${type} request for brand: ${brandName}`);

    let sheetId: string;
    let reviews: ReviewRow[];

    // Step 1: Get reviews based on input type
    if (type === 'link' && url) {
      sendProgress(`🔗 Processing Google Sheet URL...`);
      // Link flow: Extract sheet ID and read data
      const extractedId = extractSheetId(url);
      if (!extractedId) {
        res.status(400).json({ error: 'Could not extract Google Sheet ID from URL' });
        return;
      }
      sheetId = extractedId;
      console.log(`📊 Reading from sheet: ${sheetId}`);
      sendProgress(`📊 Reading data from sheet...`);

      try {
        const rows = await getSheetRows(sheetId, 'Sheet1');
        reviews = rows as ReviewRow[];
      } catch (error: any) {
        // Check for permission error (403)
        if (
          error.code === 403 ||
          (error.response && error.response.status === 403) ||
          (error.message && (error.message.includes('403') || error.message.includes('permission') || error.message.includes('Forbidden')))
        ) {
          console.error('❌ Permission denied accessing sheet');
          res.status(403).json({
            error: 'Permission denied. Please share the sheet with our service email.',
            requiresShare: true,
            shareEmail: config.gmail.userEmail
          });
          return;
        }
        throw error;
      }
    } else if (type === 'file' && file) {
      sendProgress(`📁 Processing uploaded file: ${file.originalname}`);
      // File flow: Parse Excel, copy template, append data
      console.log(`📁 Processing file: ${file.originalname}`);

      // Parse the Excel file
      reviews = parseExcelBuffer(file.buffer, file.originalname);
      console.log(`  Parsed ${reviews.length} rows from file`);
      sendProgress(`✅ Parsed ${reviews.length} rows from file`);

      // Copy template sheet
      sendProgress(`📄 Creating new Google Sheet from template...`);
      const fileName = file.originalname.replace(/\.(xlsx|xls|csv)$/i, '');
      sheetId = await copyTemplateSheet(fileName);
      console.log(`  Created new sheet: ${sheetId}`);
      sendProgress(`✅ Created new sheet: ${sheetId}`);

      // Append data to new sheet
      sendProgress(`📝 Uploading data to Google Sheet...`);
      await appendToSheet(sheetId, reviews, 'Sheet1');
      console.log(`  Appended ${reviews.length} rows to sheet`);
    } else {
      res.status(400).json({ error: 'Invalid request: must provide either URL or file' });
      return;
    }

    // Step 2: Remove duplicates by URL
    const uniqueReviews = removeDuplicates(reviews);
    console.log(`🔍 After dedup: ${uniqueReviews.length} unique reviews`);

    // Step 3: Filter to only low ratings (≤3 stars)
    const lowRatedReviews = filterLowRatings(uniqueReviews);
    console.log(`⭐ Low-rated reviews (≤3): ${lowRatedReviews.length}`);
    sendProgress(`🔍 Found ${lowRatedReviews.length} low-rated reviews (≤3 stars) to process`);

    // Step 4: Process each review
    let processedCount = 0;
    let nonCompliantCount = 0;

    for (const review of lowRatedReviews) {
      processedCount++;
      const progressMsg = `🔄 Processing review ${processedCount}/${lowRatedReviews.length}: "${review.Title?.substring(0, 30)}..."`;
      console.log(`\n${progressMsg}`);
      sendProgress(progressMsg);

      try {
        // Check compliance
        const compliance = await checkCompliance(review.Body);
        console.log(`  Compliance: ${compliance}`);

        // Update sheet with compliance result
        await updateSheetRow(sheetId, 'Title', review.Title, {
          ...review,
          'Comment is correct or not ': compliance,
        }, 'Sheet1');

        // If non-compliant (AI returns 'no'), generate email
        if (compliance === 'no') {
          nonCompliantCount++;
          console.log(`  ✉️ Generating email for non-compliant review...`);
          sendProgress(`  ⚠️ Non-compliant review found. Generating removal request email...`, 'info');

          // Generate email
          const emailContent = await generateEmail(
            review.Body,
            review.URL,
            review.Variation || 'N/A',
            brandName
          );

          // Create Gmail draft
          sendProgress(`  📧 Creating Gmail draft for: ${brandName}...`);
          await createDraft(emailContent.subject, emailContent.body, brandName);
          console.log(`  📧 Draft created: ${emailContent.subject.substring(0, 50)}...`);
          sendProgress(`  ✅ Gmail draft created successfully`, 'success');

          // Update sheet with email content
          const emailText = `Subject: ${emailContent.subject}\n\n${emailContent.body.replace(/<br>/g, '\n')}`;
          await updateSheetRow(sheetId, 'Title', review.Title, {
            'email ': emailText,
          }, 'Sheet1');
        }

        // Small delay to avoid rate limiting
        await delay(500);
      } catch (error) {
        console.error(`  ❌ Error processing review:`, error);
        sendProgress(`  ❌ Error processing review: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        // Continue with next review
      }
    }

    // Step 5: Return success response
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    console.log(`\n✅ Processing complete!`);
    sendProgress(`✅ Processing complete! ${processedCount} reviews analyzed.`, 'success');
    sendProgress(`📊 Final Sheet: ${sheetUrl}`, 'success');

    res.json({
      resetUrl: `Message Drafted, Sheet link is ${sheetUrl}`,
      stats: {
        totalReviews: reviews.length,
        uniqueReviews: uniqueReviews.length,
        lowRatedReviews: lowRatedReviews.length,
        processed: processedCount,
        nonCompliant: nonCompliantCount,
      },
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
