
import Airtable from 'airtable';

// Configure Airtable
const getBase = () => {
    if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) {
        throw new Error("Missing Airtable Credentials");
    }
    return new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(process.env.AIRTABLE_BASE_ID);
};

// Map Airtable record to App Object
const mapRecord = (record: any) => ({
    id: record.id,
    ...record.fields
});

export async function getAirtableData(tableName: string) {
    try {
        const base = getBase();
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Airtable fetch timeout for ${tableName}`)), 15000)
        );

        const fetchPromise = base(tableName).select().all();

        const records: any = await Promise.race([fetchPromise, timeoutPromise]);
        return records.map(mapRecord);
    } catch (error: any) {
        // Log warning but return empty array to allow app to use default data
        console.warn(`Airtable fetch error for ${tableName}:`, error.message || error);
        return [];
    }
}

export async function createAirtableRecord(tableName: string, fields: any) {
    const base = getBase();
    try {
        const records = await base(tableName).create([{ fields }]);
        return mapRecord(records[0]);
    } catch (error: any) {
        console.error(`Create Error ${tableName}:`, error);
        throw new Error(error.message || "Failed to create record");
    }
}

export async function deleteAirtableRecordByCode(tableName: string, code: string) {
    const base = getBase();
    // Find record ID by code
    const records = await base(tableName).select({
        filterByFormula: `{code} = '${code}'`,
        maxRecords: 1
    }).firstPage();

    if (records.length > 0) {
        await base(tableName).destroy(records[0].id);
        return true;
    }
    return false;
}

export async function deleteAirtableRecordById(tableName: string, id: string) {
    const base = getBase();
    try {
        await base(tableName).destroy(id);
        return true;
    } catch (error) {
        console.error("Delete Error", error);
        return false;
    }
}

export async function updateAirtableRecord(tableName: string, id: string, fields: any) {
    const base = getBase();
    try {
        await base(tableName).update(id, fields);
        return true;
    } catch (error) {
        console.error("Update Error", error);
        throw error;
    }
}

export async function batchCreateAirtableRecords(tableName: string, items: any[]) {
    const base = getBase();
    // Airtable allows creating up to 10 records per call
    const chunks = [];
    for (let i = 0; i < items.length; i += 10) {
        chunks.push(items.slice(i, i + 10).map(item => ({ fields: item })));
    }

    let count = 0;
    for (const chunk of chunks) {
        await base(tableName).create(chunk);
        count += chunk.length;
    }
    return count;
}

export async function batchUpdateAirtableRecords(tableName: string, items: any[]) {
    // This requires knowing the Record ID. 
    // If we only have Code, we must fetch existing records first to map Code -> ID.
    const base = getBase();
    const existingRecords = await base(tableName).select().all();
    const codeToIdMap = new Map(existingRecords.map(r => [String(r.get('code') || '').trim(), r.id]));

    const updates = [];
    const creates = [];

    for (const item of items) {
        const itemCode = String(item.code || '').trim();
        if (codeToIdMap.has(itemCode)) {
            updates.push({
                id: codeToIdMap.get(itemCode) as string,
                fields: item
            });
        } else {
            creates.push({ fields: item });
        }
    }

    // Processing Updates (Max 10 per call)
    for (let i = 0; i < updates.length; i += 10) {
        await base(tableName).update(updates.slice(i, i + 10));
    }

    // Processing Creates (Max 10 per call)
    for (let i = 0; i < creates.length; i += 10) {
        await base(tableName).create(creates.slice(i, i + 10));
    }

    return { updated: updates.length, created: creates.length };
}
