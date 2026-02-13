'use server'

import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import {
    getRowsFromSheet, addRowToSheet, deleteRowFromSheet, updateRowInSheet,
    ensureSheetWithHeaders, addMultipleRowsToSheet, clearSheet
} from '../lib/google-sheets';

// Google Sheets implementation for ticket logs
const SHEET_NAME_TICKETS = 'HelpDeskLogs';
const SHEET_NAME_MK = 'MK_Branches';
const SHEET_NAME_CUSTOMER = 'Customers';
const SHEET_NAME_RESOLVER = 'Resolvers';

// --- Default Master Data (Static) ---

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

import { MK_BRANCHES, CUSTOMERS, RESOLVERS } from '../lib/master-data';

// --- Master Data Handling with In-Memory Cache (Robust Fix) ---

// Global Cache Variables (Server-Side Memory)
// Note: On Vercel Serverless, this cache is per-instance and may be cleared on cold starts.
// This is actually desirable behavior (automatic refresh on new instances).
let _masterDataCache: any = null;
let _lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // Cache for 60 minutes

export async function fetchMasterData(forceRefresh: boolean = false) {
    const now = Date.now();

    // 1. Return Cache if available, fresh, and not forced
    if (!forceRefresh && _masterDataCache && (now - _lastFetchTime < CACHE_TTL_MS)) {
        console.log("Serving Master Data from In-Memory Cache.");
        return withStaticDropdowns(_masterDataCache);
    }

    // 2. Fetch from Sheets
    console.log("Fetching Master Data from Google Sheets (Fresh)...");
    try {
        const [mk, customer, resolvers] = await Promise.all([
            getRowsFromSheet(SHEET_NAME_MK),
            getRowsFromSheet(SHEET_NAME_CUSTOMER),
            getRowsFromSheet(SHEET_NAME_RESOLVER)
        ]);

        const data = {
            mk: mk || [],
            customer: customer || [],
            resolvers: resolvers || []
        };

        // 3. Update Cache
        _masterDataCache = data;
        _lastFetchTime = now;

        return withStaticDropdowns(data);

    } catch (error) {
        console.error("Error fetching master data from sheets:", error);
        // Fallback to cache if fetch fails? Or empty.
        if (_masterDataCache) return withStaticDropdowns(_masterDataCache);
        return withStaticDropdowns({ mk: [], customer: [], resolvers: [] });
    }
}

// Helper to attach static dropdowns
function withStaticDropdowns(data: any) {
    const caseErrors = DEFAULT_CASE_ERRORS.map((d, i) => ({ id: `s-ce-${i}`, name: d }));
    const symptoms = DEFAULT_SYMPTOMS.map((d, i) => ({ id: `s-sym-${i}`, name: d }));
    const solutions = DEFAULT_SOLUTIONS.map((d, i) => ({ id: `s-sol-${i}`, name: d }));
    return {
        ...data,
        caseErrors,
        symptoms,
        solutions
    };
}

// Helper (unused but kept for ref)
async function fetchStaticMasterData() {
    return withStaticDropdowns({
        mk: MK_BRANCHES,
        customer: CUSTOMERS,
        resolvers: RESOLVERS,
    });
}

// --- Sync Action (One-time use to populate Sheets) ---
export async function syncMasterDataToSheets() {
    console.log("Starting Sync Master Data to Sheets...");
    try {
        // 1. Ensure Sheets Exist with Headers
        await ensureSheetWithHeaders(SHEET_NAME_MK, ['code', 'name', 'pos', 'machine']);
        await ensureSheetWithHeaders(SHEET_NAME_CUSTOMER, ['code', 'name', 'pos', 'machine']);
        await ensureSheetWithHeaders(SHEET_NAME_RESOLVER, ['id', 'name']);

        // 2. Clear existing data
        await clearSheet(SHEET_NAME_MK);
        await clearSheet(SHEET_NAME_CUSTOMER);
        await clearSheet(SHEET_NAME_RESOLVER);

        // 3. Add Hardcoded Data (Re-ensure headers first as clear might wipe them)
        await ensureSheetWithHeaders(SHEET_NAME_MK, ['code', 'name', 'pos', 'machine']);
        await ensureSheetWithHeaders(SHEET_NAME_CUSTOMER, ['code', 'name', 'pos', 'machine']);
        await ensureSheetWithHeaders(SHEET_NAME_RESOLVER, ['id', 'name']);

        if (MK_BRANCHES.length > 0) await addMultipleRowsToSheet(SHEET_NAME_MK, MK_BRANCHES);
        if (CUSTOMERS.length > 0) await addMultipleRowsToSheet(SHEET_NAME_CUSTOMER, CUSTOMERS);
        if (RESOLVERS.length > 0) await addMultipleRowsToSheet(SHEET_NAME_RESOLVER, RESOLVERS);

        console.log("Sync Complete.");

        // Invalidate Cache
        _masterDataCache = null;

        return { success: true };
    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, error: error.message };
    }
}

// ... Remove all other CRUD for CaseError, Symptom, Solution ...

export async function fetchHelpDeskRecords(month?: string, year?: string) {
    console.log(`Fetching HelpDesk Records from Google Sheets [${SHEET_NAME_TICKETS}]`);
    try {
        const rows = await getRowsFromSheet(SHEET_NAME_TICKETS);

        let filteredRows = rows;

        // Apply Month/Year Filters if provided
        if (month || year) {
            filteredRows = rows.filter((row: any) => {
                const dateStr = row['วันที่เกิดปัญหา'];
                if (!dateStr) return false;
                const date = new Date(dateStr);

                const monthMatch = month ? (date.getMonth() + 1) === parseInt(month) : true;
                const yearMatch = year ? date.getFullYear() === parseInt(year) : true;

                return monthMatch && yearMatch;
            });
        }

        // Sort by Date Descending
        filteredRows.sort((a: any, b: any) => {
            const dateA = new Date(`${a['วันที่เกิดปัญหา']} ${a['เวลาที่เกิดปัญหา'] || '00:00'}`);
            const dateB = new Date(`${b['วันที่เกิดปัญหา']} ${b['เวลาที่เกิดปัญหา'] || '00:00'}`);
            return dateB.getTime() - dateA.getTime();
        });

        return filteredRows.map((r: any) => ({
            id: r._rowNumber, // Google Sheets row number as ID
            ...r
        }));

    } catch (error) {
        console.error("Google Sheets Fetch Error:", error);
        return [];
    }
}

export async function updateHelpDeskRecord(id: string, fields: any) {
    try {
        console.log("Updating Row Google Sheet:", id, fields);
        // id is row index (rowNumber from sheet).
        // Sheet library uses 0-based array index which maps to (rowNumber - 2).

        const rowIndex = parseInt(id) - 2;
        if (isNaN(rowIndex) || rowIndex < 0) return { success: false, error: "Invalid Row ID" };

        const result = await updateRowInSheet(SHEET_NAME_TICKETS, rowIndex, fields);
        if (result.success) {
            revalidatePath('/report');
            return { success: true };
        }
        return { success: false, error: result.error || 'Failed to update Google Sheet' };
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function deleteHelpDeskRecord(id: string) {
    try {
        console.log("Deleting Row Google Sheet:", id);
        const rowIndex = parseInt(id) - 2;
        if (isNaN(rowIndex) || rowIndex < 0) return { success: false, error: "Invalid Row ID" };

        const result = await deleteRowFromSheet(SHEET_NAME_TICKETS, rowIndex);
        if (result.success) {
            revalidatePath('/report');
            return { success: true };
        }
        return { success: false, error: result.error || 'Failed to delete row from Google Sheet' };
    } catch (error: any) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

export async function submitHelpDesk(formData: FormData) {
    const branchCode = formData.get('branchCode') as string;
    const branchName = formData.get('branchName') as string;
    const posSystem = formData.get('posSystem') as string;
    const machine = formData.get('machine') as string;

    // Server-side validation
    if (!branchCode || !branchName) {
        return { success: false, error: 'ข้อมูลสาขาไม่ครบถ้วน กรุณาเลือกสาขาใหม่อีกครั้ง' };
    }

    const rowData = {
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
        "Timestamp": new Date().toISOString()
    };

    console.log("Submitting to Google Sheet:", SHEET_NAME_TICKETS, rowData);

    const result = await addRowToSheet(SHEET_NAME_TICKETS, rowData);

    if (result.success) {
        revalidatePath('/report');
        return { success: true };
    } else {
        return { success: false, error: result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Google Sheets' };
    }
}

// --- CRUD Actions Disabled (Static Mode) ---
// Since we switched to static master data and Google Sheets for logs,
// the previous Airtable CRUD actions for master data are temporarily disabled/removed
// to prevent errors and confusion.

// --- CRUD Actions for Master Data (Sheet Backed) ---

function getRowIndex(id: string) {
    // Helper to parse ID from Sheet (assuming we use _rowNumber or similar logic)
    // If ID is just row index from getRows (which we mapped to id), we can use it.
    // However, if we migrated from Airtable ID strings, we might have issues.
    // In fetchMasterData, we didn't map _rowNumber to ID explicitly for MK/Customer yet in `_fetchMasterDataFromSheets`.
    // Let's fix `_fetchMasterDataFromSheets` logic? No, `getRowsFromSheet` adds `_rowNumber`.
    // But `unstable_cache` returns raw objects.
    // We should ensure IDs are usable.
    const idx = parseInt(id) - 2; // Sheets 1-based, Header row 1.
    return idx;
}

export async function addMKBranch(data: any) {
    const res = await addRowToSheet(SHEET_NAME_MK, data);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}

export async function updateMKBranch(id: string, data: any) {
    const idx = parseInt(id) - 2;
    const res = await updateRowInSheet(SHEET_NAME_MK, idx, data);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}

export async function deleteMKBranch(id: string) {
    const idx = parseInt(id) - 2;
    const res = await deleteRowFromSheet(SHEET_NAME_MK, idx);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}


export async function addCustomer(data: any) {
    const res = await addRowToSheet(SHEET_NAME_CUSTOMER, data);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}
export async function updateCustomer(id: string, data: any) {
    const idx = parseInt(id) - 2;
    const res = await updateRowInSheet(SHEET_NAME_CUSTOMER, idx, data);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}
export async function deleteCustomer(id: string) {
    const idx = parseInt(id) - 2;
    const res = await deleteRowFromSheet(SHEET_NAME_CUSTOMER, idx);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}


export async function addResolver(name: string) {
    const res = await addRowToSheet(SHEET_NAME_RESOLVER, { id: `res-${Date.now()}`, name });
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}
export async function updateResolver(id: string, name: string) {
    const idx = parseInt(id) - 2;
    const res = await updateRowInSheet(SHEET_NAME_RESOLVER, idx, { name });
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}
export async function deleteResolver(id: string) {
    const idx = parseInt(id) - 2;
    const res = await deleteRowFromSheet(SHEET_NAME_RESOLVER, idx);
    if (res.success) _masterDataCache = null; // Invalidate Cache
    return res;
}

// Keep CaseError etc static for now as requested/implied
export async function addCaseError(data: { name: string }) { return { success: false, error: "Static Mode (CaseErrors)" }; }
export async function updateCaseError(id: string, data: { name: string }) { return { success: false, error: "Static Mode (CaseErrors)" }; }
export async function deleteCaseError(id: string) { return { success: false, error: "Static Mode (CaseErrors)" }; }

export async function addSymptom(data: { name: string }) { return { success: false, error: "Static Mode (Symptoms)" }; }
export async function updateSymptom(id: string, data: { name: string }) { return { success: false, error: "Static Mode (Symptoms)" }; }
export async function deleteSymptom(id: string) { return { success: false, error: "Static Mode (Symptoms)" }; }

export async function addSolution(data: { name: string }) { return { success: false, error: "Static Mode (Solutions)" }; }
export async function updateSolution(id: string, data: { name: string }) { return { success: false, error: "Static Mode (Solutions)" }; }
export async function deleteSolution(id: string) { return { success: false, error: "Static Mode (Solutions)" }; }

// --- End of Actions ---
