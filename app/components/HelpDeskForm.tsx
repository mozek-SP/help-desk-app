'use client'

import { useState, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitHelpDesk } from '../actions'
import {
    CheckCircle2, Send, ArrowLeft, Info, User,
    Sparkles, Layers, Terminal, ChevronRight, Search, X,
    Calendar, Clock, Store, Monitor, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Master Data Type
export interface MasterDataItem {
    code: string;
    name: string;
    pos: string;
    machine: string;
}

interface HelpDeskFormProps {
    type: 'MK' | 'ลูกค้าทั่วไป';
    themeColor: string;
    masterData: MasterDataItem[];
    resolvers?: any[];
    caseErrors?: any[];
    symptoms?: any[];
    solutions?: any[];
}

export default function HelpDeskForm({ type, themeColor, masterData, resolvers = [], caseErrors = [], symptoms = [], solutions = [] }: HelpDeskFormProps) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ success?: boolean, message?: string }>({})

    // State สำหรับ Auto-fill
    const [formData, setFormData] = useState({
        branchCode: '',
        branchName: '',
        posSystem: '',
        machine: ''
    })

    // State สำหรับการเลือกหัวข้อ "อื่นๆ"
    const [selections, setSelections] = useState({
        caseError: '',
        errorSymptom: '',
        solution: '',
        resolver: '',
        contactChannel: ''
    })

    // Searchable Dropdown State
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    // Filter master data for dropdown
    const filteredMasterData = masterData.filter(item =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelectionChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSelections(prev => ({ ...prev, [name]: value }));
    }

    const primaryGradient = type === 'MK'
        ? 'linear-gradient(45deg, #3b82f6, #6366f1)'
        : 'linear-gradient(45deg, #f43f5e, #fb7185)';

    const iconColor = type === 'MK' ? '#3b82f6' : '#f43f5e';

    // ตั้งค่า Label และ Data ตามประเภท
    const codeLabel = type === 'MK' ? 'รหัสสาขา' : 'ชื่อบริษัท';
    const nameLabel = type === 'MK' ? 'ชื่อสาขา' : 'จังหวัด';
    const activeData = [...masterData].sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), 'th'));
    // ฟังก์ชันจัดการเมื่อเลือก รหัสสาขา / ชื่อบริษัท
    const handleBranchChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedCode = e.target.value;
        const entry = activeData.find(b => b.code === selectedCode);

        if (entry) {
            setFormData({
                branchCode: selectedCode,
                branchName: entry.name,
                posSystem: entry.pos,
                machine: entry.machine
            });
        } else {
            setFormData({
                branchCode: selectedCode,
                branchName: '',
                posSystem: '',
                machine: ''
            });
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setStatus({})

        const form = e.currentTarget

        // Validation: Ensure branch data is selected
        if (!formData.branchCode) {
            setStatus({ success: false, message: `กรุณาเลือก${codeLabel}จากรายการให้ถูกต้อง` })
            setLoading(false)
            // Scroll to the search input
            const searchInput = form.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            return
        }

        const data = new FormData(form)
        data.append('type', type)

        // Explicitly set branch data from state to ensure it's captured correctly
        data.set('branchCode', formData.branchCode)
        data.set('branchName', formData.branchName)
        data.set('posSystem', formData.posSystem)
        data.set('machine', formData.machine)

        // ถ้าเลือก "อื่นๆ" ให้ใช้ค่าจากช่องกรอกแทน
        const fields = ['caseError', 'errorSymptom', 'solution', 'resolver', 'contactChannel'];
        fields.forEach(field => {
            if (data.get(field) === 'อื่นๆ (โปรดระบุ)') {
                const otherValue = data.get(`${field}Other`);
                if (otherValue) data.set(field, otherValue as string);
            }
        });

        const result = await submitHelpDesk(data)

        if (result.success) {
            setStatus({ success: true, message: 'บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว!' })
            form.reset()
            // Reset auto-fill data and Search Term
            setFormData({ branchCode: '', branchName: '', posSystem: '', machine: '' })
            setSelections({ caseError: '', errorSymptom: '', solution: '', resolver: '', contactChannel: '' })
            setSearchTerm('')

            // Clear Status after 3 seconds
            setTimeout(() => {
                setStatus({})
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }, 3000)
        } else {
            setStatus({ success: false, message: result.error })
        }
        setLoading(false)
    }

    return (
        <div className="container-fluid min-vh-100 py-5" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                {/* Navigation */}
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <Link href="/" className="btn btn-link text-decoration-none text-secondary fw-bold p-0 mb-4 d-inline-flex align-items-center gap-2">
                        <ArrowLeft size={18} /> กลับหน้าหลัก
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card border-0 shadow-sm"
                    style={{ borderRadius: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.03) !important' }}
                >
                    {/* Header */}
                    <div className="bg-white p-4 p-md-5 border-bottom border-light">
                        <div className="row align-items-center">
                            <div className="col">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <span className="badge rounded-pill fw-bold" style={{ backgroundColor: type === 'MK' ? '#eef2ff' : '#fff1f2', color: iconColor, padding: '8px 16px' }}>
                                        {type} FORM
                                    </span>
                                </div>
                                <h1 className="h2 fw-bold text-dark mb-0">บันทึกข้อมูล <span style={{ color: iconColor }}>Help Desk</span></h1>
                            </div>
                            <div className="col-auto d-none d-md-block">
                                <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '70px', height: '70px', backgroundColor: '#f8f9fa', color: iconColor }}>
                                    {type === 'MK' ? <Sparkles size={32} /> : <Terminal size={32} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-4 p-md-5 bg-white">
                        <div className="row g-4">
                            {/* Section: General Info */}
                            <div className="col-12">
                                <h3 className="h6 fw-bold text-muted mb-4 text-uppercase tracking-wider d-flex align-items-center gap-2">
                                    <Layers size={18} /> ข้อมูลเบื้องต้น
                                </h3>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">วันที่เกิดปัญหา</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><Calendar size={18} /></span>
                                            <input name="issueDate" type="date" className="form-control border-0 bg-light py-3 px-3" required style={{ borderRadius: '12px' }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">เวลาที่เกิดปัญหา</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0"><Clock size={18} /></span>
                                            <input name="issueTime" type="time" className="form-control border-0 bg-light py-3 px-3" required style={{ borderRadius: '12px' }} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">{codeLabel}</label>
                                        <div className="flex-grow-1 position-relative">
                                            <input
                                                type="hidden" // Hidden input for form submission
                                                name="branchCode"
                                                value={formData.branchCode}
                                            />
                                            <div className="position-relative">
                                                <span className="input-group-text position-absolute top-50 start-0 translate-middle-y border-0 bg-transparent ms-2 z-1">
                                                    <Search size={18} className="text-secondary" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-0 bg-light py-3 ps-5 pe-3"
                                                    placeholder={`ค้นหา${codeLabel} หรือ ชื่อ...`}
                                                    value={searchTerm}
                                                    onChange={(e) => {
                                                        setSearchTerm(e.target.value)
                                                        setShowDropdown(true)
                                                        if (e.target.value === '') {
                                                            setFormData({ branchCode: '', branchName: '', posSystem: '', machine: '' })
                                                        }
                                                    }}
                                                    onFocus={() => setShowDropdown(true)}
                                                    style={{ borderRadius: '12px' }}
                                                    autoComplete="off"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        type="button"
                                                        className="btn border-0 position-absolute top-50 end-0 translate-middle-y text-muted me-2"
                                                        onClick={() => {
                                                            setSearchTerm('')
                                                            setFormData(prev => ({ ...prev, branchCode: '', branchName: '', posSystem: '', machine: '' }))
                                                            setShowDropdown(false)
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Dropdown Results */}
                                            <AnimatePresence>
                                                {showDropdown && searchTerm && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="position-absolute w-100 bg-white shadow-lg rounded-4 border mt-2"
                                                        style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}
                                                    >
                                                        {filteredMasterData.length > 0 ? (
                                                            filteredMasterData.map((item, index) => (
                                                                <div
                                                                    key={`${item.code}-${index}`}
                                                                    className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                                    onClick={() => {
                                                                        setSearchTerm(item.code)
                                                                        setFormData({
                                                                            branchCode: item.code,
                                                                            branchName: item.name || '-',
                                                                            posSystem: item.pos || '-',
                                                                            machine: item.machine || '-'
                                                                        })
                                                                        setShowDropdown(false)
                                                                    }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <div className="d-flex justify-content-between">
                                                                        <span className="fw-bold text-primary">{item.code}</span>
                                                                        {type === 'MK' && <span className="text-muted small">สาขา {item.name}</span>}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-center text-muted small">ไม่พบข้อมูล</div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">{nameLabel}</label>
                                        <input
                                            name="branchName"
                                            type="text"
                                            className="form-control border-0 bg-secondary-subtle py-3 px-3"
                                            placeholder={`ข้อมูล${nameLabel}`}
                                            value={formData.branchName}
                                            readOnly
                                            onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                                            style={{ borderRadius: '12px' }}
                                        />
                                        <small className="text-muted d-block mt-1">อ้างอิงอัตโนมัติจาก{codeLabel}</small>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4 text-light" />

                            {/* Section: System */}
                            <div className="col-12">
                                <h3 className="h6 fw-bold text-muted mb-4 text-uppercase tracking-wider d-flex align-items-center gap-2">
                                    <Monitor size={18} /> ระบบและอุปกรณ์
                                </h3>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">ระบบ POS</label>
                                        <input
                                            name="posSystem"
                                            type="text"
                                            className="form-control border-0 bg-secondary-subtle py-3 px-3"
                                            placeholder="เวอร์ชั่นระบบ"
                                            value={formData.posSystem}
                                            readOnly
                                            onChange={(e) => setFormData({ ...formData, posSystem: e.target.value })}
                                            style={{ borderRadius: '12px' }}
                                        />
                                        <small className="text-muted d-block mt-1">อ้างอิงอัตโนมัติจาก{codeLabel}</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">เครื่อง (Machine)</label>
                                        <input
                                            name="machine"
                                            type="text"
                                            className="form-control border-0 bg-secondary-subtle py-3 px-3"
                                            placeholder="S/N หรือ ID เครื่อง"
                                            value={formData.machine}
                                            readOnly
                                            onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                                            style={{ borderRadius: '12px' }}
                                        />
                                        <small className="text-muted d-block mt-1">อ้างอิงอัตโนมัติจาก{codeLabel}</small>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4 text-light" />

                            {/* Section: Details */}
                            <div className="col-12">
                                <h3 className="h6 fw-bold text-muted mb-4 text-uppercase tracking-wider d-flex align-items-center gap-2">
                                    <AlertCircle size={18} /> รายละเอียดปัญหาและการแก้ไข
                                </h3>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">Case Error</label>
                                        <select
                                            name="caseError"
                                            className="form-select border-0 bg-light py-3 px-3"
                                            required
                                            style={{ borderRadius: '12px' }}
                                            onChange={handleSelectionChange}
                                        >
                                            <option value="">-- เลือก Case Error --</option>
                                            {caseErrors && caseErrors.length > 0 ? (
                                                caseErrors.map((item: any, index: number) => (
                                                    <option key={item.id || index} value={item.name}>{item.name}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="Software Error">Software Error</option>
                                                    <option value="Hardware Error">Hardware Error</option>
                                                    <option value="Human Error">Human Error</option>
                                                    <option value="FCC Error">FCC Error</option>
                                                    <option value="ADD User">ADD User</option>
                                                    <option value="Install Software">Install Software</option>
                                                </>
                                            )}
                                            <option value="อื่นๆ (โปรดระบุ)">อื่นๆ (โปรดระบุ)</option>
                                        </select>
                                        <AnimatePresence>
                                            {selections.caseError === 'อื่นๆ (โปรดระบุ)' && (
                                                <motion.input
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: '45px' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    name="caseErrorOther"
                                                    type="text"
                                                    className="form-control border-0 bg-primary-subtle mt-2 py-2 px-3"
                                                    placeholder="ระบุ Case Error อื่นๆ"
                                                    required
                                                    style={{ borderRadius: '10px' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">อาการ Error</label>
                                        <select
                                            name="errorSymptom"
                                            className="form-select border-0 bg-light py-3 px-3"
                                            required
                                            style={{ borderRadius: '12px' }}
                                            onChange={handleSelectionChange}
                                        >
                                            <option value="">-- เลือกอาการ Error --</option>
                                            {symptoms && symptoms.length > 0 ? (
                                                symptoms.map((item: any, index: number) => (
                                                    <option key={item.id || index} value={item.name}>{item.name}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="ชำระเงิน แต่ปิดโต๊ะไม่ได้">ชำระเงิน แต่ปิดโต๊ะไม่ได้</option>
                                                    <option value="เปิด cash loop ไม่ได้">เปิด cash loop ไม่ได้</option>
                                                    <option value="ยอดชำระรายการซ้ำ">ยอดชำระรายการซ้ำ</option>
                                                    <option value="ยอด Cashloop กับ POS ไม่ตรงกัน">ยอด Cashloop กับ POS ไม่ตรงกัน</option>
                                                    <option value="แลกเงิน / แลกเงินทริปแล้วค้าง">แลกเงิน / แลกเงินทริปแล้วค้าง</option>
                                                    <option value="เครื่องธนบัตรเงินติด ขึ้น Error ไฟกระพริบ">เครื่องธนบัตรเงินติด ขึ้น Error ไฟกระพริบ</option>
                                                    <option value="เครื่องเหรียญเงินติด ขึ้น Error ไฟกระพริบ">เครื่องเหรียญเงินติด ขึ้น Error ไฟกระพริบ</option>
                                                    <option value="พนักงานใส่เหรียญ 0.25 / 0.50 ไม่ครบบาท">พนักงานใส่เหรียญ 0.25 / 0.50 ไม่ครบบาท</option>
                                                    <option value="Add User">Add User</option>
                                                    <option value="สาย LAN หรือสายการเชื่อมต่อมีปัญหา">สาย LAN หรือสายการเชื่อมต่อมีปัญหา</option>
                                                    <option value="ปิดสิ้นวันแล้วเครื่องให้เติมเงินมากกว่าปกติ">ปิดสิ้นวันแล้วเครื่องให้เติมเงินมากกว่าปกติ</option>
                                                    <option value="ลืมนำเหรียญออกจากเครื่องเหรียญแล้วดันปิดกล่องเหรียญไปก่อน">ลืมนำเหรียญออกจากเครื่องเหรียญแล้วดันปิดกล่องเหรียญไปก่อน</option>
                                                    <option value="ลืมหยิบหรือหยิบเงินทอนออกจากเครื่องไม่หมด">ลืมหยิบหรือหยิบเงินทอนออกจากเครื่องไม่หมด</option>
                                                    <option value="Install Software">Install Software</option>
                                                </>
                                            )}
                                            <option value="อื่นๆ (โปรดระบุ)">อื่นๆ (โปรดระบุ)</option>
                                        </select>
                                        <AnimatePresence>
                                            {selections.errorSymptom === 'อื่นๆ (โปรดระบุ)' && (
                                                <motion.input
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: '45px' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    name="errorSymptomOther"
                                                    type="text"
                                                    className="form-control border-0 bg-primary-subtle mt-2 py-2 px-3"
                                                    placeholder="ระบุอาการ Error อื่นๆ"
                                                    required
                                                    style={{ borderRadius: '10px' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-bold text-dark">วิธีแก้ไข</label>
                                        <select
                                            name="solution"
                                            className="form-select border-0 bg-light py-3 px-3"
                                            required
                                            style={{ borderRadius: '12px' }}
                                            onChange={handleSelectionChange}
                                        >
                                            <option value="">-- เลือกวิธีแก้ไข --</option>
                                            {solutions && solutions.length > 0 ? (
                                                solutions.map((item: any, index: number) => (
                                                    <option key={item.id || index} value={item.name}>{item.name}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="ทำการ Reset Control Center ใหม่">ทำการ Reset Control Center ใหม่</option>
                                                    <option value="ทำการ Reset FCC ใหม่">ทำการ Reset FCC ใหม่</option>
                                                    <option value="ทำการคืนเงินให้ลูกค้าแล้วให้ลูกค้าชำระใหม่">ทำการคืนเงินให้ลูกค้าแล้วให้ลูกค้าชำระใหม่</option>
                                                    <option value="Add User">Add User</option>
                                                    <option value="ส่งช่างเข้าแก้ไขหน้างาน">ส่งช่างเข้าแก้ไขหน้างาน</option>
                                                    <option value="แก้ไขปัญหาเบื้องต้นสอนการแก้ไขนำเงินที่ติดออก ทดสอบใช้งานปกติ">แก้ไขปัญหาเบื้องต้นสอนการแก้ไขนำเงินที่ติดออก ทดสอบใช้งานปกติ</option>
                                                    <option value="ทำการแก้ไขรายการผ่าน DataBase แก้ไขรายการซ้ำ">ทำการแก้ไขรายการผ่าน DataBase แก้ไขรายการซ้ำ</option>
                                                    <option value="ให้สาขาดูยอดของ POS เป็นหลักและนับเงินที่ออกจากเครื่อง CashLoop ให้ยอดขายตรงกับ POS และคืนเงินเต็มที่เหลือให้ Cashier">ให้สาขาดูยอดของ POS เป็นหลักและนับเงินที่ออกจากเครื่อง CashLoop ให้ยอดขายตรงกับ POS และคืนเงินเต็มที่เหลือให้ Cashier</option>
                                                    <option value="ทำการ ปลดล็อคเพื่อให้สาขาใส่กล่องเงินกลับเข้าเครื่องได้">ทำการ ปลดล็อคเพื่อให้สาขาใส่กล่องเงินกลับเข้าเครื่องได้</option>
                                                    <option value="ให้สาขาแจ้งกับทาง ระบบPOS">ให้สาขาแจ้งกับทาง ระบบPOS</option>
                                                    <option value="ให้สาขานำเงินที่เอาออกมาจากเครื่องโดยไม่ใส่รหัสนำกลับมาใส่เข้าเครื่องใหม่ผ่าน Posstandrat">ให้สาขานำเงินที่เอาออกมาจากเครื่องโดยไม่ใส่รหัสนำกลับมาใส่เข้าเครื่องใหม่ผ่าน Posstandrat</option>
                                                    <option value="ทำการปลดล็อคกล่องเหรียญให้ลูกค้าเอาเงินเหรียญออกมา">ทำการปลดล็อคกล่องเหรียญให้ลูกค้าเอาเงินเหรียญออกมา</option>
                                                    <option value="ให้สาขาหยิบเงินทอนออกมาให้หมด">ให้สาขาหยิบเงินทอนออกมาให้หมด</option>
                                                    <option value="Install Software ใหม่">Install Software ใหม่</option>
                                                </>
                                            )}
                                            <option value="อื่นๆ (โปรดระบุ)">อื่นๆ (โปรดระบุ)</option>
                                        </select>
                                        <AnimatePresence>
                                            {selections.solution === 'อื่นๆ (โปรดระบุ)' && (
                                                <motion.textarea
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: '80px' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    name="solutionOther"
                                                    className="form-control border-0 bg-primary-subtle mt-2 py-2 px-3"
                                                    placeholder="ระบุวิธีแก้ไขอื่นๆ"
                                                    required
                                                    style={{ borderRadius: '10px' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">ผู้แก้ไข</label>
                                        <select
                                            name="resolver"
                                            className="form-select border-0 bg-light py-3 px-3"
                                            required
                                            style={{ borderRadius: '12px' }}
                                            onChange={handleSelectionChange}
                                        >
                                            <option value="">-- เลือกผู้แก้ไข --</option>
                                            {resolvers && resolvers.length > 0 ? (
                                                resolvers.map((res: any, index: number) => (
                                                    <option key={res.id || index} value={res.name}>{res.name}</option>
                                                ))
                                            ) : (
                                                <option value="" disabled>รอการ Sync ข้อมูล...</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-dark">ช่องทางติดต่อ</label>
                                        <select
                                            name="contactChannel"
                                            className="form-select border-0 bg-light py-3 px-3"
                                            required
                                            style={{ borderRadius: '12px' }}
                                            onChange={handleSelectionChange}
                                        >
                                            <option value="">-- เลือกช่องทางติดต่อ --</option>
                                            <option value="Call Center">Call Center</option>
                                            <option value="Line OA CgroupSmile">Line OA CgroupSmile</option>
                                            <option value="ไลน์กลุ่ม MK">ไลน์กลุ่ม MK</option>
                                            <option value="เบอร์โทรส่วนตัว">เบอร์โทรส่วนตัว</option>
                                            <option value="Line ส่วนตัว">Line ส่วนตัว</option>
                                            <option value="อื่นๆ (โปรดระบุ)">อื่นๆ (โปรดระบุ)</option>
                                        </select>
                                        <AnimatePresence>
                                            {selections.contactChannel === 'อื่นๆ (โปรดระบุ)' && (
                                                <motion.input
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: '45px' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    name="contactChannelOther"
                                                    type="text"
                                                    className="form-control border-0 bg-primary-subtle mt-2 py-2 px-3"
                                                    placeholder="ระบุช่องทางติดต่ออื่นๆ"
                                                    required
                                                    style={{ borderRadius: '10px' }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="col-12 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-lg w-100 py-3 fw-bold text-white shadow-sm border-0 d-flex align-items-center justify-content-center gap-2"
                                    style={{
                                        borderRadius: '15px',
                                        background: primaryGradient,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                        <>บันทึกข้อมูลเข้าระบบ <Send size={20} /></>
                                    )}
                                </button>
                            </div>

                            {/* Status Message */}
                            <AnimatePresence>
                                {status.message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`col-12 mt-4 p-4 rounded-4 d-flex align-items-center gap-3 border ${status.success
                                            ? 'bg-success-subtle text-success border-success-subtle'
                                            : 'bg-danger-subtle text-danger border-danger-subtle'
                                            }`}
                                    >
                                        {status.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                        <span className="fw-bold">{status.message}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </motion.div>

                <p className="text-center mt-5 text-secondary small fw-medium">
                    © 2026 Help Desk Pro Intelligence <br />
                    <span className="text-muted opacity-75">Secure Support Management System</span>
                </p>
            </div>

            <style jsx>{`
                .form-control:focus, .form-select:focus {
                    background-color: #fff !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                    border: 0 !important;
                }

                .form-control, .form-select {
                    border-radius: 12px !important;
                }
                .hover-bg-light:hover {
                    background-color: #f8f9fa;
                }
                input[type="date"], input[type="time"] {
                    border-radius: 12px !important;
                }
                .btn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                }
            `}</style>
        </div >
    )
}
