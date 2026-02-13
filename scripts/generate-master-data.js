const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'temp_excel_data.json');
const outputPath = path.join(__dirname, '..', 'lib', 'master-data.ts');

const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Process Resolvers to add IDs
const resolvers = rawData.Resolvers.map((r, index) => ({
    id: `res-${index + 1}`,
    name: r.name
}));

const tsContent = `
export interface BranchData {
    code: string;
    name: string;
    pos: string;
    machine: string;
}

export interface CustomerData {
    code: string;
    name: string;
    pos: string;
    machine: string;
}

export interface ResolverData {
    id: string;
    name: string;
}

// ----------------------------------------------------------------------
// ข้อมูลสาขา MK (Branches)
// ----------------------------------------------------------------------
export const MK_BRANCHES: BranchData[] = ${JSON.stringify(rawData.Branches, null, 4)};

// ----------------------------------------------------------------------
// ข้อมูลลูกค้า (Customers)
// ----------------------------------------------------------------------
export const CUSTOMERS: CustomerData[] = ${JSON.stringify(rawData.Customers, null, 4)};

// ----------------------------------------------------------------------
// ข้อมูลผู้แก้ไข (Resolvers)
// ----------------------------------------------------------------------
export const RESOLVERS: ResolverData[] = ${JSON.stringify(resolvers, null, 4)};
`;

fs.writeFileSync(outputPath, tsContent);
console.log(`Updated ${outputPath} with ${rawData.Branches.length} Branches, ${rawData.Customers.length} Customers, and ${resolvers.length} Resolvers.`);
