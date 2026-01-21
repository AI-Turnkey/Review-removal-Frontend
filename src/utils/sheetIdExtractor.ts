/**
 * Utility to extract Google Sheet ID from various URL formats
 */

/**
 * Extracts the Google Sheet ID from a URL
 * Supports formats like:
 * - https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
 * - https://docs.google.com/spreadsheets/d/{SHEET_ID}
 * - https://drive.google.com/open?id={SHEET_ID}
 * 
 * @param url - The Google Sheets or Drive URL
 * @returns The sheet ID or null if not found
 */
export function extractSheetId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Try standard Sheets URL pattern: /spreadsheets/d/{ID}
  const sheetsMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetsMatch) {
    return sheetsMatch[1];
  }

  // Try Drive open URL pattern: open?id={ID}
  try {
    const parsedUrl = new URL(url);
    const idParam = parsedUrl.searchParams.get('id');
    if (idParam) {
      return idParam;
    }
  } catch {
    // Not a valid URL, continue
  }

  return null;
}
