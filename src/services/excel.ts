import * as XLSX from 'xlsx';

export interface ReviewRow {
  Date: string;
  Author: string;
  Verified: string;
  Helpful: string;
  Title: string;
  Body: string;
  Rating: string | number;
  Images: string;
  Videos: string;
  URL: string;
  Variation: string;
  Style: string;
  'Comment is correct or not '?: string;
  'email '?: string;
}

/**
 * Parse an Excel file buffer and extract rows
 * @param buffer - The file buffer
 * @returns Array of row objects
 */
export function parseExcelBuffer(buffer: Buffer, fileName?: string): ReviewRow[] {
  try {
    // Read the workbook
    // For CSVs, we might need to handle encoding, but XLSX usually does a good job.
    // We can pass the filename to help identification if needed, but type: 'buffer' works for both.
    const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 65001 }); // Force UTF-8

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    // Map to ReviewRow format
    return data.map((row) => ({
      Date: String(row.Date || ''),
      Author: String(row.Author || ''),
      Verified: String(row.Verified || ''),
      Helpful: String(row.Helpful || ''),
      Title: String(row.Title || ''),
      Body: String(row.Body || ''),
      Rating: row.Rating ?? '',
      Images: String(row.Images || ''),
      Videos: String(row.Videos || ''),
      URL: String(row.URL || ''),
      Variation: String(row.Variation || ''),
      Style: String(row.Style || ''),
    }));
  } catch (error) {
    console.error(`Error parsing file ${fileName || ''}:`, error);
    throw error;
  }
}

/**
 * Remove duplicate rows based on URL
 */
export function removeDuplicates(rows: ReviewRow[]): ReviewRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!row.URL || seen.has(row.URL)) {
      return false;
    }
    seen.add(row.URL);
    return true;
  });
}

/**
 * Filter rows to only include ratings <= 3
 */
export function filterLowRatings(rows: ReviewRow[]): ReviewRow[] {
  return rows.filter((row) => {
    const rating = typeof row.Rating === 'number' ? row.Rating : parseFloat(String(row.Rating));
    return !isNaN(rating) && rating <= 3;
  });
}
