const Airtable = require('airtable');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                // Remove comments if any
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.error("Could not read .env.local", e);
}

const Config = {
    PAT: process.env.AIRTABLE_PAT,
    BaseId: process.env.AIRTABLE_BASE_ID,
    Tables: [
        process.env.AIRTABLE_TABLE_MK || 'Branches',
        process.env.AIRTABLE_TABLE_CUSTOMER || 'Customers',
        process.env.AIRTABLE_TABLE_RESOLVER || 'Resolvers',
        process.env.AIRTABLE_TABLE_NAME || 'Tickets'
    ]
};

console.log("Configuration Check:");
console.log(`Base ID: ${Config.BaseId}`);
console.log(`PAT: ${Config.PAT ? Config.PAT.substring(0, 10) + '...' : 'MISSING'}`);

if (!Config.PAT || !Config.BaseId) {
    console.error("❌ Missing Credentials in .env.local");
    process.exit(1);
}

const base = new Airtable({ apiKey: Config.PAT }).base(Config.BaseId);

async function checkTable(tableName) {
    console.log(`\n-----------------------------------`);
    console.log(`Checking table: "${tableName}"...`);
    try {
        const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
        if (records.length > 0) {
            console.log(`✅ Success! Found records.`);
            console.log(`   Sample Data:`, JSON.stringify(records[0].fields).substring(0, 100) + "...");
        } else {
            console.log(`⚠️  Table exists but is EMPTY (0 records).`);
        }
    } catch (err) {
        console.error(`❌ Error fetching "${tableName}":`);
        console.error(`   ${err.message}`);
        if (err.statusCode === 404) {
            console.log(`   👉 Advice: Check if table name is spelled EXACTLY '${tableName}' in Airtable.`);
        }
    }
}

async function run() {
    for (const table of Config.Tables) {
        await checkTable(table);
    }
}

run();
