const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1 && !line.trim().startsWith('#')) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

const PAT = env.AIRTABLE_PAT;
const BASE = env.AIRTABLE_BASE_ID;
const TABLE = env.AIRTABLE_TABLE_MK || 'Branches';

console.log(`Testing Fetch with: Base=${BASE}, Table=${TABLE}, PAT=...${PAT ? PAT.slice(-4) : 'Mq'}`);

async function run() {
    try {
        const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}?maxRecords=3`;
        console.log(`Fetching: ${url}`);

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${PAT}`
            }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
            console.log('Error Text:', await res.text());
        } else {
            const json = await res.json();
            console.log('Success! Records:', json.records?.length);
            if (json.records?.length > 0) {
                console.log('Sample:', JSON.stringify(json.records[0].fields));
            }
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

run();
