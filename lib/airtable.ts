
import Airtable from 'airtable';

// Configure Airtable
const getBase = () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const pat = process.env.AIRTABLE_PAT;

    if (!baseId || !pat) {
        console.error("❌ Airtable Config Missing:", { baseId: !!baseId, pat: !!pat });
        throw new Error("Airtable Configuration Missing");
    }

    // Log connection attempt (safely)
    console.log(`🔌 Connecting to Airtable Base: ${baseId}, PAT ending in ...${pat.slice(-4)}`);

    return new Airtable({ apiKey: pat }).base(baseId);
};

// Map Airtable record to App Object
const mapRecord = (record: any) => ({
    id: record.id,
    ...record.fields
});

export async function getAirtableData(tableName: string) {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const pat = process.env.AIRTABLE_PAT;

    // Construct URL (Handle spaces in table names)
    const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

    try {
        console.log(`📡 Fetching ${tableName} via Native Fetch...`);

        // Initial Fetch
        const res = await fetch(baseUrl, {
            headers: { Authorization: `Bearer ${pat}` },
            cache: 'no-store', // Disable Next.js caching to ensure fresh data
            signal: AbortSignal.timeout(20000) // 20s timeout
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`❌ API Error ${tableName} [${res.status}]:`, errText);
            if (res.status === 404) {
                console.warn(`   -> Table "${tableName}" not found.`);
                return [];
            }
            throw new Error(`Airtable API ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const records = data.records || [];

        // Simple Pagination (Limit to 5 pages / ~500 records for safety)
        let offset = data.offset;
        let pageCount = 0;

        while (offset && pageCount < 5) {
            const nextUrl = `${baseUrl}?offset=${offset}`;
            try {
                const nextRes = await fetch(nextUrl, {
                    headers: { Authorization: `Bearer ${pat}` },
                    cache: 'no-store',
                    signal: AbortSignal.timeout(10000)
                });

                if (nextRes.ok) {
                    const nextData = await nextRes.json();
                    if (nextData.records) records.push(...nextData.records);
                    offset = nextData.offset;
                    pageCount++;
                } else {
                    console.warn(`   -> Pagination failed for ${tableName} page ${pageCount + 2}`);
                    break;
                }
            } catch (e) {
                console.error(`   -> Pagination timeout/error for ${tableName}`);
                break;
            }
        }

        console.log(`✅ Success ${tableName}: ${records.length} records.`);

        return records.map((record: any) => ({
            id: record.id,
            ...record.fields
        }));

    } catch (error: any) {
        // Log warning but return empty array to allow app to use default data
        console.error(`🚨 Fatal Fetch Error for ${tableName}:`, error.message || error);
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
