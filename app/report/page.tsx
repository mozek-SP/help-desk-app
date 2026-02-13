'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, Shield, ArrowLeft, Trash2, Edit, Search,
    X, CheckCircle2, AlertCircle, LogOut, Filter, User,
    ChevronLeft, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { fetchHelpDeskRecords, deleteHelpDeskRecord, updateHelpDeskRecord, fetchMasterData } from '../actions'

const AUTH_USERS = [
    { id: 'admin', pass: 'Creatus!1', name: 'Administrator', scope: 'all' },
    { id: 'kampol', pass: 'Creatus!1', name: 'กัมพล เพ็งหิรัญ', scope: 'individual' },
    { id: 'thanongsak', pass: 'Creatus!1', name: 'ทนงศักดิ์ ศรีสวัสดิ์', scope: 'individual' },
    { id: 'suwatchai', pass: 'Creatus!1', name: 'สุวัฒน์ชัย อินทรสิทธิ์', scope: 'individual' },
    { id: 'vasupol', pass: 'Creatus!1', name: 'วสุพล พรหมราช', scope: 'individual' },
    { id: 'seksan', pass: 'Creatus!1', name: 'เศกสรรค์ พรหมจรรย์', scope: 'individual' }
]

const CASE_ERROR_OPTIONS = ["Software Error", "Hardware Error", "Human Error", "FCC Error", "ADD User", "Install Software", "อื่นๆ (โปรดระบุ)"]
const SYMPTOM_OPTIONS = [
    "ชำระเงิน แต่ปิดโต๊ะไม่ได้", "เปิด cash loop ไม่ได้", "ยอดชำระรายการซ้ำ", "ยอด Cashloop กับ POS ไม่ตรงกัน",
    "แลกเงิน / แลกเงินทริปแล้วค้าง", "เครื่องธนบัตรเงินติด ขึ้น Error ไฟกระพริบ", "เครื่องเหรียญเงินติด ขึ้น Error ไฟกระพริบ",
    "พนักงานใส่เหรียญ 0.25 / 0.50 ไม่ครบบาท", "Add User", "สาย LAN หรือสายการเชื่อมต่อมีปัญหา",
    "ปิดสิ้นวันแล้วเครื่องให้เติมเงินมากกว่าปกติ", "ลืมนำเหรียญออกจากเครื่องเหรียญแล้วดันปิดกล่องเหรียญไปก่อน",
    "ลืมหยิบหรือหยิบเงินทอนออกจากเครื่องไม่หมด", "Install Software", "อื่นๆ (โปรดระบุ)"
]
const SOLUTION_OPTIONS = [
    "ทำการ Reset Control Center ใหม่", "ทำการ Reset FCC ใหม่", "ทำการคืนเงินให้ลูกค้าแล้วให้ลูกค้าชำระใหม่",
    "Add User", "ส่งช่างเข้าแก้ไขหน้างาน", "แก้ไขปัญหาเบื้องต้นสอนการแก้ไขนำเงินที่ติดออก ทดสอบใช้งานปกติ",
    "ทำการแก้ไขรายการผ่าน DataBase แก้ไขรายการซ้ำ", "ให้สาขาดูยอดของ POS เป็นหลักและนับเงินที่ออกจากเครื่อง CashLoop ให้ยอดขายตรงกับ POS และคืนเงินเต็มที่เหลือให้ Cashier",
    "ทำการ ปลดล็อคเพื่อให้สาขาใส่กล่องเงินกลับเข้าเครื่องได้", "ให้สาขาแจ้งกับทาง ระบบPOS",
    "ให้สาขานำเงินที่เอาออกมาจากเครื่องโดยไม่ใส่รหัสนำกลับมาใส่เข้าเครื่องใหม่ผ่าน Posstandrat",
    "ทำการปลดล็อคกล่องเหรียญให้ลูกค้าเอาเงินเหรียญออกมา", "ให้สาขาหยิบเงินทอนออกมาให้หมด",
    "Install Software ใหม่", "อื่นๆ (โปรดระบุ)"
]
const CONTACT_OPTIONS = ["Call Center", "Line OA CgroupSmile", "ไลน์กลุ่ม MK", "เบอร์โทรส่วนตัว", "Line ส่วนตัว", "อื่นๆ (โปรดระบุ)"]

export default function ReportPage() {
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [editingRecord, setEditingRecord] = useState<any>(null)
    const [resolvers, setResolvers] = useState<any[]>([])
    const [masterData, setMasterData] = useState<any>({ mk: [], customer: [] })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(50)

    // Filter State (Default to current month/year)
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
    const [selectedResolver, setSelectedResolver] = useState('')

    useEffect(() => {
        loadMasterData()
    }, [])

    async function loadMasterData() {
        const data = await fetchMasterData()

        // Robust natural sorting (M21 comes before M100)
        const safeSort = (arr: any[]) => {
            if (!arr) return [];
            return [...arr].sort((a, b) => {
                const valA = String(a.code || '').trim();
                const valB = String(b.code || '').trim();
                return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
            });
        };

        const sortedMk = safeSort(data.mk || []);
        const sortedCustomer = safeSort(data.customer || []);

        setResolvers(data.resolvers || [])
        setMasterData({ mk: sortedMk, customer: sortedCustomer })
    }

    async function loadRecords() {
        setLoading(true)
        setError('')
        try {
            // Pass selected filters to the server action
            const data = await fetchHelpDeskRecords(selectedMonth, selectedYear)
            setRecords(data)
        } catch (err: any) {
            console.error("Load Records Error:", err)
            setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล")
        } finally {
            setLoading(false)
        }
    }

    // Reload when filters change (only if logged in)
    useEffect(() => {
        if (user) {
            loadRecords()
        }
    }, [selectedMonth, selectedYear])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        const foundUser = AUTH_USERS.find(u => u.id === loginForm.id && u.pass === loginForm.pass)
        if (foundUser) {
            setUser(foundUser)
            setError('')
            loadRecords()
        } else {
            setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง')
        }
    }

    const handleLogout = () => {
        setUser(null)
        setRecords([])
        setLoginForm({ id: '', pass: '' })
    }

    const handleDelete = async (id: string, resolver: string) => {
        if (user.scope !== 'all' && resolver !== user.name) {
            alert('คุณไม่มีสิทธิ์ลบรายการของผู้อื่น')
            return
        }

        if (confirm('คุณต้องการลบรายงานนี้ใช่หรือไม่?')) {
            const res = await deleteHelpDeskRecord(id)
            if (res.success) {
                setRecords(records.filter(r => r.id !== id))
            } else {
                alert('เกิดข้อผิดพลาดในการลบ')
            }
        }
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        // We create a copy of fields excluding 'id' for Airtable update
        const { id, ...fields } = editingRecord
        const res = await updateHelpDeskRecord(id, fields)
        if (res.success) {
            setRecords(records.map(r => r.id === id ? editingRecord : r))
            setEditingRecord(null)
            alert('อัปเดตข้อมูลสำเร็จ')
        } else {
            alert('เกิดข้อผิดพลาดในการอัปเดต: ' + res.error)
        }
    }

    // Filter logic
    const filteredRecords = records.filter(r => {
        // Scope Check
        if (user?.scope === 'individual' && String(r['ผู้แก้ไข'] || '').trim() !== String(user.name).trim()) return false

        // Resolver Filter
        if (selectedResolver && String(r['ผู้แก้ไข'] || '') !== selectedResolver) return false

        // Search Term Check
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            String(r['ชื่อสาขา'] || '').toLowerCase().includes(search) ||
            String(r['รหัสสาขา'] || '').toLowerCase().includes(search) ||
            String(r['อาการ Error'] || '').toLowerCase().includes(search) ||
            String(r['ผู้แก้ไข'] || '').toLowerCase().includes(search)
        )
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
    const currentRecords = filteredRecords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset page when filter results change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedMonth, selectedYear, selectedResolver])

    if (!user) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card border-0 shadow-lg p-4 p-md-5 rounded-4 bg-white"
                    style={{ maxWidth: '450px', width: '100%' }}
                >
                    <div className="text-center mb-4">
                        <div className="bg-primary-subtle d-inline-flex p-3 rounded-circle mb-3">
                            <FileText size={40} className="text-primary" />
                        </div>
                        <h2 className="h3 fw-bold mb-1">Help Desk Report</h2>
                        <p className="text-muted">กรุณาเข้าสู่ระบบเพื่อดูรายงาน</p>
                    </div>

                    <form onSubmit={handleLogin} className="vstack gap-3">
                        <div>
                            <label className="form-label small fw-bold">Username</label>
                            <input
                                type="text"
                                className="form-control py-3 border-light bg-light rounded-3"
                                value={loginForm.id}
                                onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label small fw-bold">Password</label>
                            <input
                                type="password"
                                className="form-control py-3 border-light bg-light rounded-3"
                                value={loginForm.pass}
                                onChange={(e) => setLoginForm({ ...loginForm, pass: e.target.value })}
                                required
                            />
                        </div>
                        {error && (
                            <div className="alert alert-danger py-2 border-0 rounded-3 small">
                                <AlertCircle size={14} className="me-2" /> {error}
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary py-3 fw-bold mt-2 shadow-sm border-0 rounded-3" style={{ background: 'linear-gradient(45deg, #3b82f6, #6366f1)' }}>
                            เข้าสู่ระบบ
                        </button>
                        <Link href="/" className="btn btn-link text-decoration-none text-secondary small text-center mt-2">
                            <ArrowLeft size={14} className="me-1" /> กลับหน้าหลัก
                        </Link>
                    </form>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-vh-100 bg-light pb-5">
            {/* Sticky Header Container */}
            <div className="sticky-top bg-light pb-2 pt-0" style={{ zIndex: 1020 }}>
                {/* Navbar */}
                <nav className="navbar navbar-expand-lg navbar-dark shadow-sm py-3" style={{ background: 'linear-gradient(45deg, #1e293b, #334155)' }}>
                    <div className="container">
                        <Link href="/" className="navbar-brand fw-bold d-flex align-items-center gap-2">
                            <FileText /> Report Portal
                        </Link>
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-none d-md-block text-white me-2">
                                <User size={14} className="me-1 text-primary-subtle" />
                                <span className="small fw-bold">{user.name}</span>
                                <span className="badge bg-primary-subtle text-primary ms-2 rounded-pill small">{user.scope === 'all' ? 'Admin' : 'Resolver'}</span>
                            </div>
                            <button onClick={handleLogout} className="btn btn-outline-light btn-sm rounded-pill px-3">
                                <LogOut size={14} className="me-1" /> ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Filter & Summary Bar */}
                <div className="container mt-3">
                    <div className="row g-3">
                        {/* Filter Section */}
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                                <div className="d-flex flex-column flex-md-row align-items-center gap-3">
                                    <div className="d-flex gap-2 w-100 w-md-auto">
                                        <select
                                            className="form-select bg-light border-0"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            style={{ minWidth: '120px' }}
                                        >
                                            <option value="">ทุกเดือน</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>
                                                    {new Date(0, m - 1).toLocaleDateString('th-TH', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                <option key={y} value={y}>{y + 543}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={selectedResolver}
                                            onChange={(e) => setSelectedResolver(e.target.value)}
                                            style={{ minWidth: '150px' }}
                                        >
                                            <option value="">ผู้แก้ไขทั้งหมด</option>
                                            {resolvers.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-0"><Search size={18} className="text-muted" /></span>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0 py-2"
                                            placeholder="ค้นหา..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button className="btn bg-light border-0" onClick={() => setSearchTerm('')}>
                                                <X size={18} className="text-muted" />
                                            </button>
                                        )}
                                    </div>
                                    <button onClick={loadRecords} disabled={loading} className="btn btn-primary d-none d-md-flex align-items-center gap-2 rounded-3 px-4 shadow-sm border-0">
                                        {loading ? <span className="spinner-border spinner-border-sm" /> : <Filter size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary & Pagination Section */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary-subtle p-3 rounded-circle">
                                        <FileText size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="h2 fw-bold m-0">{filteredRecords.length}</h4>
                                        <p className="text-muted small m-0">รายการรายงาน</p>
                                    </div>
                                </div>
                                {/* Pagination Controls (Moved Here) */}
                                {!loading && filteredRecords.length > 0 && (
                                    <div className="d-flex align-items-center gap-1">
                                        <button
                                            className="btn btn-light btn-sm rounded-circle border p-2"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            title="หน้าก่อนหน้า"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="small fw-bold mx-2 text-muted">
                                            {currentPage}/{totalPages}
                                        </span>
                                        <button
                                            className="btn btn-light btn-sm rounded-circle border p-2"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            title="หน้าถัดไป"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-2">
                {/* Main Table Card */}
                <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light sticky-top" style={{ top: 0, zIndex: 10 }}>
                                <tr>
                                    <th className="px-4 py-3 border-0 small fw-bold text-secondary">วันที่/เวลา</th>
                                    <th className="py-3 border-0 small fw-bold text-secondary">รหัส/ชื่อสาขา</th>
                                    <th className="py-3 border-0 small fw-bold text-secondary">อาการ Error</th>
                                    <th className="py-3 border-0 small fw-bold text-secondary">ผู้แก้ไข</th>
                                    <th className="px-4 py-3 border-0 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status"></div>
                                            <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="text-muted">ไม่พบข้อมูลรายงานย้อนหลัง</div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentRecords.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold small">{item['วันที่เกิดปัญหา']}</div>
                                                <div className="text-muted extra-small">{item['เวลาที่เกิดปัญหา']}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="fw-bold">{item['รหัสสาขา']}</div>
                                                <div className="small text-muted text-truncate" style={{ maxWidth: '150px' }}>{item['ชื่อสาขา']}</div>
                                            </td>
                                            <td className="py-3">
                                                <span className="badge bg-light text-dark fw-medium border small">{item['Case Error']}</span>
                                                <div className="small text-secondary mt-1">{item['อาการ Error']}</div>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="bg-light p-1 rounded-circle"><User size={12} /></div>
                                                    <span className="small">{item['ผู้แก้ไข']}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-pill border-0"
                                                        onClick={() => setEditingRecord({ ...item })}
                                                        title="แก้ไข"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-pill border-0"
                                                        onClick={() => handleDelete(item.id, item['ผู้แก้ไข'])}
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Edit All Fields */}
            <AnimatePresence>
                {editingRecord && (
                    <div className="modal-backdrop-custom show d-flex align-items-start justify-content-center p-3 overflow-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-4 shadow-lg w-100 overflow-hidden my-4"
                            style={{ maxWidth: '800px' }}
                        >
                            <div className="p-4 border-bottom bg-light d-flex justify-content-between align-items-center sticky-top">
                                <h5 className="m-0 fw-bold">แก้ไขข้อมูลรายงาน</h5>
                                <button className="btn btn-link p-0 text-muted" onClick={() => setEditingRecord(null)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSaveEdit} className="p-4">
                                <div className="row g-3">
                                    {/* General Info */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">วันที่เกิดปัญหา</label>
                                        <input type="date" className="form-control bg-light border-0"
                                            value={editingRecord['วันที่เกิดปัญหา'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'วันที่เกิดปัญหา': e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">เวลาที่เกิดปัญหา</label>
                                        <input type="time" className="form-control bg-light border-0"
                                            value={editingRecord['เวลาที่เกิดปัญหา'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'เวลาที่เกิดปัญหา': e.target.value })}
                                        />
                                    </div>

                                    {/* Branch & Machine (Auto-fill matching submission form) */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">รหัสสาขา / บริษัท</label>
                                        <select
                                            className="form-select bg-light border-0"
                                            value={editingRecord['รหัสสาขา'] || ''}
                                            onChange={(e) => {
                                                const selectedCode = e.target.value;
                                                const type = editingRecord['ประเภท'] === 'MK' ? 'mk' : 'customer';
                                                const masterList = masterData[type] || [];
                                                const entry = masterList.find((b: any) => String(b.code) === selectedCode);

                                                if (entry) {
                                                    setEditingRecord({
                                                        ...editingRecord,
                                                        'รหัสสาขา': selectedCode,
                                                        'ชื่อสาขา': entry.name,
                                                        'ระบบ POS': entry.pos,
                                                        'Machine': entry.machine
                                                    });
                                                } else {
                                                    setEditingRecord({ ...editingRecord, 'รหัสสาขา': selectedCode });
                                                }
                                            }}
                                        >
                                            <option value="">-- เลือกรายการ --</option>
                                            {(editingRecord['ประเภท'] === 'MK' ? masterData.mk : masterData.customer)?.map((item: any) => (
                                                <option key={item.code} value={item.code}>{item.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">ชื่อสาขา / จังหวัด</label>
                                        <input className="form-control bg-secondary-subtle border-0"
                                            value={editingRecord['ชื่อสาขา'] || ''}
                                            readOnly
                                        />
                                        <small className="text-muted extra-small">อ้างอิงอัตโนมัติจากรหัส</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">ระบบ POS</label>
                                        <input className="form-control bg-secondary-subtle border-0"
                                            value={editingRecord['ระบบ POS'] || ''}
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">Machine</label>
                                        <input className="form-control bg-secondary-subtle border-0"
                                            value={editingRecord['Machine'] || ''}
                                            readOnly
                                        />
                                    </div>

                                    <hr className="my-2" />

                                    {/* Issue Details - Dropdowns matching main form */}
                                    <div className="col-md-12">
                                        <label className="form-label small fw-bold">Case Error</label>
                                        <select className="form-select bg-light border-0"
                                            value={editingRecord['Case Error'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'Case Error': e.target.value })}
                                        >
                                            <option value="">-- เลือก Case Error --</option>
                                            {CASE_ERROR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>

                                    <div className="col-md-12">
                                        <label className="form-label small fw-bold">อาการ Error</label>
                                        <select className="form-select bg-light border-0"
                                            value={editingRecord['อาการ Error'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'อาการ Error': e.target.value })}
                                        >
                                            <option value="">-- เลือกอาการ Error --</option>
                                            {SYMPTOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        <textarea className="form-control bg-primary-subtle border-0 mt-2" placeholder="กรณีอื่นๆ โปรดระบุ..." rows={1}
                                            value={!SYMPTOM_OPTIONS.includes(editingRecord['อาการ Error']) ? editingRecord['อาการ Error'] : ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'อาการ Error': e.target.value })}
                                        />
                                    </div>

                                    <div className="col-md-12">
                                        <label className="form-label small fw-bold">วิธีแก้ไข</label>
                                        <select className="form-select bg-light border-0"
                                            value={editingRecord['วิธีแก้ไข'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'วิธีแก้ไข': e.target.value })}
                                        >
                                            <option value="">-- เลือกวิธีแก้ไข --</option>
                                            {SOLUTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                        <textarea className="form-control bg-primary-subtle border-0 mt-2" placeholder="กรณีอื่นๆ โปรดระบุ..." rows={2}
                                            value={!SOLUTION_OPTIONS.includes(editingRecord['วิธีแก้ไข']) ? editingRecord['วิธีแก้ไข'] : ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'วิธีแก้ไข': e.target.value })}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">ผู้แก้ไข</label>
                                        <select className="form-select bg-light border-0"
                                            value={editingRecord['ผู้แก้ไข'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'ผู้แก้ไข': e.target.value })}
                                        >
                                            <option value="">-- เลือกผู้แก้ไข --</option>
                                            {resolvers.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold">ช่องทางติดต่อ</label>
                                        <select className="form-select bg-light border-0"
                                            value={editingRecord['ช่องทางติดต่อ'] || ''}
                                            onChange={(e) => setEditingRecord({ ...editingRecord, 'ช่องทางติดต่อ': e.target.value })}
                                        >
                                            <option value="">-- เลือกช่องทางติดต่อ --</option>
                                            {CONTACT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setEditingRecord(null)}>ยกเลิก</button>
                                    <button type="submit" className="btn btn-primary rounded-pill px-4" style={{ background: 'linear-gradient(45deg, #3b82f6, #6366f1)', border: 'none' }}>
                                        บันทึกการแก้ไขทั้งหมด
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .modal-backdrop-custom {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1050;
                }
                .extra-small { font-size: 0.65rem; }
                .table-hover tbody tr:hover { background-color: rgba(59, 130, 246, 0.02); }
                .form-control:focus { box-shadow: none; background: white !important; border: 1px solid #3b82f6 !important; }
            `}</style>
        </div>
    )
}
