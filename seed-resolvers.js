const Airtable = require('airtable');
// require('dotenv').config({ path: './.env' });

const PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_RESOLVER = process.env.AIRTABLE_TABLE_RESOLVER || 'Resolvers';

async function seedResolvers() {
    if (!PAT || !BASE_ID) {
        console.error('❌ Missing API Credentials in .env');
        return;
    }

    const base = new Airtable({ apiKey: PAT }).base(BASE_ID);

    const resolvers = [
        "ทนงศักดิ์ ศรีสวัสดิ์",
        "กัมพล เพ็งหิรัญ",
        "สุวัฒน์ชัย อินทรสิทธิ์",
        "เศกสรรค์ พรหมจรรย์",
        "วสุพล พรหมราช",
        "ปภัศ ศรวัญวัชร",
        "อภิวัฒน์ มงคลรุ่งสุวรรณ",
        "ภาสกร วุฒิยิ่งยง",
        "วรัญญา จารัตน์",
        "วรวุฒิ กุลพรไพศาล"
    ];

    console.log(`🚀 Starting to seed ${resolvers.length} resolvers to table table '${TABLE_RESOLVER}'...`);

    // Create records in batches of 10 (Airtable limit per request)
    // Since we have exactly 10, one batch is enough.
    const records = resolvers.map(name => ({
        fields: {
            "name": name
        }
    }));

    try {
        const createdRecords = await base(TABLE_RESOLVER).create(records);
        console.log(`✅ Successfully added ${createdRecords.length} resolvers!`);
        createdRecords.forEach(r => console.log(`   - ${r.fields.name}`));
    } catch (error) {
        console.error('❌ Error adding resolvers:', error);
        if (error.statusCode === 403 || error.error === 'NOT_AUTHORIZED') {
            console.error('\n⚠️  PERMISSION ERROR: Your Airtable Token is likely missing access to the "Resolvers" table.');
            console.error('   Please go to https://airtable.com/create/tokens -> Edit Token -> Add "Resolvers" to the allowed tables.');
        } else if (error.statusCode === 404 || error.error === 'NOT_FOUND') {
            console.error('\n⚠️  TABLE NOT FOUND: Please make sure you created a table named "Resolvers" (capital R, ending with s).');
        }
    }
}

seedResolvers();
