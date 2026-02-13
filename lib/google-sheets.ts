
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

export const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function getDoc() {
    if (!SHEET_ID) {
        throw new Error("Missing GOOGLE_SHEET_ID in environment variables");
    }
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

export async function addRowToSheet(sheetName: string, rowData: any) {
    try {
        const doc = await getDoc();
        let sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) {
            console.log(`Sheet "${sheetName}" not found. Creating...`);
            sheet = await doc.addSheet({ title: sheetName, headerValues: Object.keys(rowData) });
        }
        await sheet.addRow(rowData);
        return { success: true };
    } catch (error: any) {
        console.error(`Google Sheets Error (AddRow - ${sheetName}):`, error);
        return { success: false, error: error.message };
    }
}

export async function addMultipleRowsToSheet(sheetName: string, rowsData: any[]) {
    try {
        if (rowsData.length === 0) return { success: true };
        const doc = await getDoc();
        let sheet = doc.sheetsByTitle[sheetName];

        // Ensure sheet exists
        if (!sheet) {
            const headers = Object.keys(rowsData[0]);
            sheet = await doc.addSheet({ title: sheetName, headerValues: headers });
        }

        await sheet.addRows(rowsData);
        return { success: true };
    } catch (error: any) {
        console.error(`Google Sheets Error (AddMultipleRows - ${sheetName}):`, error);
        return { success: false, error: error.message };
    }
}

export async function clearSheet(sheetName: string) {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetName];
        if (sheet) {
            await sheet.clear(); // Clears all data
            // We might want to re-set headers? 
            // sheet.clear() usually keeps grid properties but clears content.
            // Documentation says: clears all content and formatting.
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function ensureSheetWithHeaders(sheetName: string, headers: string[]) {
    try {
        const doc = await getDoc();
        let sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) {
            await doc.addSheet({ title: sheetName, headerValues: headers });
        } else {
            await sheet.setHeaderRow(headers);
        }
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getRowsFromSheet(sheetName: string) {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) return [];

        const rows = await sheet.getRows();
        return rows.map(row => {
            // Convert row to plain object
            const obj: any = {};
            sheet.headerValues.forEach(header => {
                obj[header] = row.get(header);
            });
            // Add a unique ID if not present (Google Sheets doesn't have a stable ID for rows easily accessible without raw API, 
            // but we can use row number or generate one. ideally we should store a UUID)
            // For now, let's assume one column is 'id' or we assign row number.
            obj._rowNumber = row.rowNumber;
            return obj;
        });
    } catch (error: any) {
        console.error(`Google Sheets Error (GetRows - ${sheetName}):`, error);
        return [];
    }
}

export async function deleteRowFromSheet(sheetName: string, rowIndex: number) {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) return { success: false, error: 'Sheet not found' };

        const rows = await sheet.getRows();
        // user row index is 1-based usually in UI, but library usage?
        // Rows array is 0-indexed, representing row 2, 3, ... in sheet (row 1 is header)
        // If we passed the internal row index from getRows (which is usually accurate for the array)
        if (rowIndex >= 0 && rowIndex < rows.length) {
            await rows[rowIndex].delete();
            return { success: true };
        }
        return { success: false, error: 'Row not found' };

    } catch (error: any) {
        console.error(`Google Sheets Error (DeleteRow - ${sheetName}):`, error);
        return { success: false, error: error.message };
    }
}

// Update needs to find the row first. 
// We should probably store a UUID in the sheet to safely identify rows.
// For now, let's assume we pass the row object or index back.
export async function updateRowInSheet(sheetName: string, rowIndex: number, newData: any) {
    try {
        const doc = await getDoc();
        const sheet = doc.sheetsByTitle[sheetName];
        if (!sheet) return { success: false, error: 'Sheet not found' };

        const rows = await sheet.getRows();
        if (rowIndex >= 0 && rowIndex < rows.length) {
            const row = rows[rowIndex];
            Object.keys(newData).forEach(key => {
                row.set(key, newData[key]);
            });
            await row.save();
            return { success: true };
        }
        return { success: false, error: 'Row not found' };
    } catch (error: any) {
        console.error(`Google Sheets Error (UpdateRow - ${sheetName}):`, error);
        return { success: false, error: error.message };
    }
}
