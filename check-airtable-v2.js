const fs = require('fs');
const path = require('path');
let Airtable;

try {
    Airtable = require('airtable');
} catch (e) {
    console.error('MISSING_MODULE');
    process.exit(1);
}

// Manual .env.local parsing
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1 && !line.trim().startsWith('#')) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            process.env[key] = val;
        }
    });
}

const pat = process.env.AIRTABLE_PAT;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log(`Config Check: PAT=${pat ? '...' + pat.slice(-4) : 'MISSING'}, BaseID=${baseId || 'MISSING'}`);

if (!pat || !baseId) {
    console.error('Invalid Configuration');
    process.exit(1);
}

const base = new Airtable({ apiKey: pat }).base(baseId);

const tables = [
    { id: 'MK', name: process.env.AIRTABLE_TABLE_MK || 'Branches' },
    { id: 'CUSTOMER', name: process.env.AIRTABLE_TABLE_CUSTOMER || 'Customers' },
    { id: 'RESOLVER', name: process.env.AIRTABLE_TABLE_RESOLVER || 'Resolvers' },
    { id: 'TICKETS', name: process.env.AIRTABLE_TABLE_NAME || 'Tickets' }
];

async function check(t) {
    console.log(`Checking "${t.name}"...`);
    try {
        const records = await Promise.race([
            base(t.name).select({ maxRecords: 1 }).firstPage(),
            new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 8000))
        ]);
        console.log(`   ✅ STATUS: OK (${records.length} records)`);
    } catch (e) {
        console.log(`   ❌ ERROR: ${e.message} (Code: ${e.statusCode || 'N/A'})`);
        if (e.statusCode === 404) console.log(`      -> Likely cause: Table name "${t.name}" incorrect or missing.`);
        if (e.statusCode === 403) console.log(`      -> Likely cause: Token missing scopes or base access.`);
    }
}

(async () => {
    for (const t of tables) await check(t);
})();
