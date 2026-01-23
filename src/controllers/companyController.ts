import { Request, Response } from 'express';
import { getSheetRows, appendToSheet } from '../services/googleSheets';

// The Google Sheet ID provided by the user
const COMPANY_SHEET_ID = '1_hwlKYLZ4HpibsiEU9DP5ch5PivlsoKlgU3vgaKS9VM';
const SHEET_NAME = 'Sheet1'; // Assuming default sheet name

export const getCompanies = async (req: Request, res: Response) => {
    try {
        const rows = await getSheetRows(COMPANY_SHEET_ID, SHEET_NAME);

        // Map the rows to a consistent format
        const companies = rows.map((row) => ({
            name: row['Company Name'] || row['Company name'] || row['Brand Name'] || '', // Try potential headers
            website: row['Website'] || row['website'] || ''
        })).filter(c => c.name); // Filter out empty names

        res.json({ success: true, companies });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch companies' });
    }
};

export const addCompany = async (req: Request, res: Response) => {
    try {
        const { companyName, website } = req.body;

        if (!companyName) {
            return res.status(400).json({ success: false, error: 'Company Name is required' });
        }

        // Prepare row data. Keys must match Sheet headers exactly.
        // Based on the prompt, headers are likely "Company Name" and "Website".
        const newRow = {
            'Company Name': companyName,
            'Website': website || ''
        };

        await appendToSheet(COMPANY_SHEET_ID, [newRow], SHEET_NAME);

        res.json({ success: true, message: 'Company added successfully' });
    } catch (error) {
        console.error('Error adding company:', error);
        res.status(500).json({ success: false, error: 'Failed to add company' });
    }
};
