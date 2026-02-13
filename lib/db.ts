import { promises as fs } from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'lib/masterData.json');

export async function getMasterData() {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
}

export async function updateMasterData(data: any) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}
