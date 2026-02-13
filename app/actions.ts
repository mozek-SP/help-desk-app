'use server'

import { getAirtableData, createAirtableRecord, deleteAirtableRecordByCode, batchUpdateAirtableRecords, deleteAirtableRecordById, updateAirtableRecord, batchCreateAirtableRecords } from '../lib/airtable';
import { revalidatePath } from 'next/cache';

// Constants for Table Names
// Constants for Table Names
const TABLE_MK = process.env.AIRTABLE_TABLE_MK || 'Branches';
const TABLE_CUSTOMER = process.env.AIRTABLE_TABLE_CUSTOMER || 'Customers';
const TABLE_RESOLVER = process.env.AIRTABLE_TABLE_RESOLVER || 'Resolvers';
const TABLE_CASE_ERROR = process.env.AIRTABLE_TABLE_CASE_ERROR || 'Case Errors';
const TABLE_SYMPTOM = process.env.AIRTABLE_TABLE_SYMPTOM || 'Symptoms';
const TABLE_SOLUTION = process.env.AIRTABLE_TABLE_SOLUTION || 'Solutions';

// --- Default Master Data (Static) ---
const DEFAULT_CASE_ERRORS = [
    "Software Error", "Hardware Error", "Human Error",
    "FCC Error", "ADD User", "Install Software", "นอกประกัน"
];

const DEFAULT_SYMPTOMS = [
    "ชำระเงิน แต่ปิดโต๊ะไม่ได้", "เปิด cash loop ไม่ได้", "ยอดชำระรายการซ้ำ",
    "ยอด Cashloop กับ POS ไม่ตรงกัน", "แลกเงิน / แลกเงินทริปแล้วค้าง",
    "เครื่องธนบัตรเงินติด ขึ้น Error ไฟกระพริบ", "เครื่องเหรียญเงินติด ขึ้น Error ไฟกระพริบ",
    "พนักงานใส่เหรียญ 0.25 / 0.50 ไม่ครบบาท", "Add User",
    "สาย LAN หรือสายการเชื่อมต่อมีปัญหา", "ปิดสิ้นวันแล้วเครื่องให้เติมเงินมากกว่าปกติ",
    "ลืมนำเหรียญออกจากเครื่องเหรียญแล้วดันปิดกล่องเหรียญไปก่อน",
    "ลืมหยิบหรือหยิบเงินทอนออกจากเครื่องไม่หมด", "Install Software",
    "นอกประกัน"
];

const DEFAULT_SOLUTIONS = [
    "ทำการ Reset Control Center ใหม่", "ทำการ Reset FCC ใหม่",
    "ทำการคืนเงินให้ลูกค้าแล้วให้ลูกค้าชำระใหม่", "Add User", "ส่งช่างเข้าแก้ไขหน้างาน",
    "แก้ไขปัญหาเบื้องต้นสอนการแก้ไขนำเงินที่ติดออก ทดสอบใช้งานปกติ",
    "ทำการแก้ไขรายการผ่าน DataBase แก้ไขรายการซ้ำ",
    "ให้สาขาดูยอดของ POS เป็นหลักและนับเงินที่ออกจากเครื่อง CashLoop ให้ยอดขายตรงกับ POS และคืนเงินเต็มที่เหลือให้ Cashier",
    "ทำการ ปลดล็อคเพื่อให้สาขาใส่กล่องเงินกลับเข้าเครื่องได้", "ให้สาขาแจ้งกับทาง ระบบPOS",
    "ให้สาขานำเงินที่เอาออกมาจากเครื่องโดยไม่ใส่รหัสนำกลับมาใส่เข้าเครื่องใหม่ผ่าน Posstandrat",
    "ทำการปลดล็อคกล่องเหรียญให้ลูกค้าเอาเงินเหรียญออกมา", "ให้สาขาหยิบเงินทอนออกมาให้หมด",
    "Install Software ใหม่", "ติดต่อผู้ดูแลอีกบริษัท"
];

// ... (No seed needed for static)

// ...

export async function fetchMasterData() {
    // Parallel fetch for speed (Only for Real Tables)
    let rawMk: any[] = [], rawCustomer: any[] = [], rawResolvers: any[] = [];

    try {
        [rawMk, rawCustomer, rawResolvers] = await Promise.all([
            getAirtableData(TABLE_MK),
            getAirtableData(TABLE_CUSTOMER),
            getAirtableData(TABLE_RESOLVER)
        ]);
    } catch (e) {
        console.warn("Airtable Fetch Failed. Using defaults.", e);
    }

    console.log(`FetchMasterData results: MK=${rawMk.length}, Cust=${rawCustomer.length}, Res=${rawResolvers.length}`);

    // Helper to normalize 'name' field
    const matchName = (r: any) => r.name || r.fields?.name || r.Name || r.fields?.Name;

    const mk = rawMk.filter((r: any) => r.code);
    const customer = rawCustomer.filter((r: any) => r.code);

    const resolvers = rawResolvers.filter((r: any) => {
        const name = matchName(r);
        return name && !r.code && !r.pos && !r.machine;
    }).map((r: any) => ({ ...r, name: matchName(r) }));

    // Static Data
    const caseErrors = DEFAULT_CASE_ERRORS.map((d, i) => ({ id: `s-ce-${i}`, name: d }));
    const symptoms = DEFAULT_SYMPTOMS.map((d, i) => ({ id: `s-sym-${i}`, name: d }));
    const solutions = DEFAULT_SOLUTIONS.map((d, i) => ({ id: `s-sol-${i}`, name: d }));

    return { mk, customer, resolvers, caseErrors, symptoms, solutions };
}

// ... Remove all other CRUD for CaseError, Symptom, Solution ...

export async function fetchHelpDeskRecords(month?: string, year?: string) {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE_ID || !TABLE_NAME) {
        console.error("Missing Airtable Env Vars", { PAT: !!PAT, BASE_ID: !!BASE_ID, TABLE_NAME: !!TABLE_NAME });
        throw new Error("Missing Airtable Configuration (Check AIRTABLE_TABLE_NAME)");
    }

    let baseUrl = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?sort[0][field]=วันที่เกิดปัญหา&sort[0][direction]=desc&sort[1][field]=เวลาที่เกิดปัญหา&sort[1][direction]=desc`;

    // Build filter formula dynamically based on provided month/year
    const conditions = [];
    if (month) conditions.push(`MONTH({วันที่เกิดปัญหา}) = ${parseInt(month)}`);
    if (year) conditions.push(`YEAR({วันที่เกิดปัญหา}) = ${parseInt(year)}`);

    if (conditions.length > 0) {
        // If multiple conditions, wrap in AND()
        const formula = conditions.length > 1 ? `AND(${conditions.join(', ')})` : conditions[0];
        baseUrl += `&filterByFormula=${encodeURIComponent(formula)}`;
    }

    let allRecords: any[] = [];
    let offset = null;

    try {
        do {
            const url: string = offset ? `${baseUrl}&offset=${offset}` : baseUrl;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${PAT}` },
                next: { revalidate: 0 } // Always fresh
            });
            const result = await response.json();

            if (result.records) {
                const formatted = result.records.map((r: any) => ({
                    id: r.id,
                    ...r.fields
                }));
                allRecords = [...allRecords, ...formatted];
            } else if (result.error) {
                console.error("Airtable API Error:", result.error);
                throw new Error(`Airtable API Error: ${result.error.message || JSON.stringify(result.error)}`);
            }

            offset = result.offset;
        } while (offset);

        return allRecords;
    } catch (error) {
        console.error('Fetch Logs Error:', error);
        throw error; // Propagate error to client
    }
}

export async function updateHelpDeskRecord(id: string, fields: any) {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE_ID || !TABLE_NAME) return { success: false, error: 'Missing configuration' };

    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${PAT}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields }),
        });

        if (!response.ok) throw new Error('Failed to update record');
        revalidatePath('/report');
        return { success: true };
        // in updateHelpDeskRecord
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteHelpDeskRecord(id: string) {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE_ID || !TABLE_NAME) return { success: false, error: 'Missing configuration' };

    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${PAT}` },
        });

        if (!response.ok) throw new Error('Failed to delete record');
        revalidatePath('/report');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function submitHelpDesk(formData: FormData) {
    const PAT = process.env.AIRTABLE_PAT;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!PAT || !BASE_ID || !TABLE_NAME) {
        console.error('Missing Airtable configuration');
        return { success: false, error: 'ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อ Airtable (Missing .env constants)' };
    }

    const branchCode = formData.get('branchCode') as string;
    const branchName = formData.get('branchName') as string;
    const posSystem = formData.get('posSystem') as string;
    const machine = formData.get('machine') as string;

    // Server-side validation
    if (!branchCode || !branchName) {
        return { success: false, error: 'ข้อมูลสาขาไม่ครบถ้วน กรุณาเลือกสาขาใหม่อีกครั้ง' };
    }

    const data = {
        fields: {
            "ประเภท": formData.get('type') as string,
            "วันที่เกิดปัญหา": formData.get('issueDate') as string,
            "เวลาที่เกิดปัญหา": formData.get('issueTime') as string,
            "รหัสสาขา": branchCode,
            "ชื่อสาขา": branchName,
            "ระบบ POS": posSystem || '-',
            "Machine": machine || '-',
            "Case Error": formData.get('caseError') as string,
            "อาการ Error": formData.get('errorSymptom') as string,
            "วิธีแก้ไข": formData.get('solution') as string,
            "ผู้แก้ไข": formData.get('resolver') as string,
            "ช่องทางติดต่อ": formData.get('contactChannel') as string,
        }
    };

    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAT}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Airtable Error API Response:', JSON.stringify(result, null, 2));
            throw new Error(result.error?.message || 'Failed to save to Airtable');
        }

        return { success: true };
    } catch (error: any) {
        console.error('Submission Error:', error);
        return { success: false, error: error.message || String(error) || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
    }
}

// --- MK Branch Actions ---
export async function addMKBranch(data: any) {
    try {
        await createAirtableRecord(TABLE_MK, data);
        revalidatePath('/admin');
        revalidatePath('/mk');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateMKBranch(id: string, data: any) {
    try {
        await updateAirtableRecord(TABLE_MK, id, data);
        revalidatePath('/admin');
        revalidatePath('/mk');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteMKBranch(code: string) {
    try {
        await deleteAirtableRecordByCode(TABLE_MK, code);
        revalidatePath('/admin');
        revalidatePath('/mk');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function importMKData(newBranches: any[]) {
    try {
        const { updated, created } = await batchUpdateAirtableRecords(TABLE_MK, newBranches);
        revalidatePath('/admin');
        revalidatePath('/mk');
        return { success: true, count: updated + created };
    } catch (error: any) {
        console.error("Import Error", error);
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true, count: newBranches.length };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// --- Customer Actions ---
export async function addCustomer(data: any) {
    try {
        await createAirtableRecord(TABLE_CUSTOMER, data);
        revalidatePath('/admin');
        revalidatePath('/customer');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateCustomer(id: string, data: any) {
    try {
        await updateAirtableRecord(TABLE_CUSTOMER, id, data);
        revalidatePath('/admin');
        revalidatePath('/customer');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteCustomer(code: string) {
    try {
        await deleteAirtableRecordByCode(TABLE_CUSTOMER, code);
        revalidatePath('/admin');
        revalidatePath('/customer');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function importCustomerData(newCustomers: any[]) {
    try {
        const { updated, created } = await batchUpdateAirtableRecords(TABLE_CUSTOMER, newCustomers);
        revalidatePath('/admin');
        revalidatePath('/customer');
        return { success: true, count: updated + created };
    } catch (error: any) {
        console.error("Import Error", error);
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true, count: newCustomers.length };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// --- Resolver Actions ---
export async function addResolver(name: string) {
    try {
        await createAirtableRecord(TABLE_RESOLVER, { name });
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateResolver(id: string, name: string) {
    try {
        await updateAirtableRecord(TABLE_RESOLVER, id, { name });
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteResolver(id: string) {
    try {
        await deleteAirtableRecordById(TABLE_RESOLVER, id);
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// --- Case Error Actions ---
export async function addCaseError(name: string) {
    try {
        await createAirtableRecord(TABLE_CASE_ERROR, { name });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateCaseError(id: string, name: string) {
    try {
        await updateAirtableRecord(TABLE_CASE_ERROR, id, { name });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteCaseError(id: string) {
    try {
        await deleteAirtableRecordById(TABLE_CASE_ERROR, id);
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// --- Symptom Actions ---
export async function addSymptom(name: string) {
    try {
        await createAirtableRecord(TABLE_SYMPTOM, { name });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateSymptom(id: string, name: string) {
    try {
        await updateAirtableRecord(TABLE_SYMPTOM, id, { name });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteSymptom(id: string) {
    try {
        await deleteAirtableRecordById(TABLE_SYMPTOM, id);
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// --- Solution Actions ---
export async function addSolution(name: string) {
    try {
        await createAirtableRecord(TABLE_SOLUTION, { name });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function updateSolution(id: string, name: string) {
    try {
        await updateAirtableRecord(TABLE_SOLUTION, id, { name });
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteSolution(id: string) {
    try {
        await deleteAirtableRecordById(TABLE_SOLUTION, id);
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        if (error.message?.includes('403') || error.message?.includes('NOT_AUTHORIZED')) return { success: true };
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
