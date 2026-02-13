'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    Plus, Trash2, Shield, ArrowLeft,
    Save, Store, Building2, Terminal, Monitor,
    Download, Upload, FileSpreadsheet, UserPlus, Edit, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import {
    fetchMasterData,
    addMKBranch, deleteMKBranch, updateMKBranch,
    addCustomer, deleteCustomer, updateCustomer,
    addResolver, deleteResolver, updateResolver
} from '../actions'

export default function AdminPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'MK' | 'Customer' | 'Resolver'>('MK')
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [loginForm, setLoginForm] = useState({ username: '', password: '' })
    const [loginError, setLoginError] = useState('')

    // Form states
    const [mkForm, setMkForm] = useState({ code: '', name: '', pos: '', machine: '' })
    const [customForm, setCustomForm] = useState({ code: '', name: '', pos: '', machine: '' })
    const [resolverForm, setResolverForm] = useState({ name: '' })

    // Editor State
    const [editingId, setEditingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // บังคับให้ต้องล็อกอินใหม่ทุกครั้งที่เข้าหน้านี้ (No Session Persistence)
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)

        // Safety timeout for the UI spinner (20 seconds) - in case Server Action hangs
        const timer = setTimeout(() => {
            setLoading(false);
            console.error("Load Data Timeout forced by Client");
        }, 20000);

        try {
            const res = await fetchMasterData()
            clearTimeout(timer); // Clear timeout if successful

            // Sort by code (Handle both string and numeric types robustly)
            const safeSort = (arr: any[]) => {
                if (!arr) return [];
                return [...arr].sort((a, b) => {
                    const valA = String(a.code || '').trim();
                    const valB = String(b.code || '').trim();
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                });
            };

            if (res.mk) res.mk = safeSort(res.mk)
            if (res.customer) res.customer = safeSort(res.customer)
            if (res.resolvers) res.resolvers = [...(res.resolvers || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

            setData(res)
        } catch (err) {
            console.error("Load Data Error:", err)
            alert("ไม่สามารถดึงข้อมูลได้ (System Error)")
        } finally {
            clearTimeout(timer);
            setLoading(false)
        }
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (loginForm.username === 'admin' && loginForm.password === 'Creatus!1') {
            setIsAuthorized(true)
            setLoginError('')
        } else {
            setLoginError('Username หรือ Password ไม่ถูกต้อง')
        }
    }

    async function handleAddMK() {
        if (!mkForm.code || !mkForm.name) return
        setLoading(true)
        try {
            let res;
            if (editingId) {
                res = await updateMKBranch(editingId, mkForm)
            } else {
                res = await addMKBranch(mkForm)
            }
            if (!res.success) alert("Error: " + JSON.stringify(res.error))
            else {
                setMkForm({ code: '', name: '', pos: '', machine: '' })
                setEditingId(null)
                await loadData()
            }
        } catch (e) {
            alert("System error: " + e)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddCustomer() {
        if (!customForm.code || !customForm.name) return
        setLoading(true)
        try {
            let res;
            if (editingId) {
                res = await updateCustomer(editingId, customForm)
            } else {
                res = await addCustomer(customForm)
            }
            if (!res.success) alert("Error: " + JSON.stringify(res.error))
            else {
                setCustomForm({ code: '', name: '', pos: '', machine: '' })
                setEditingId(null)
                await loadData()
            }
        } catch (e) {
            alert("System error: " + e)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddResolver() {
        if (!resolverForm.name) return
        setLoading(true)
        try {
            let res;
            if (editingId) {
                res = await updateResolver(editingId, resolverForm.name)
            } else {
                res = await addResolver(resolverForm.name)
            }
            if (!res.success) alert("Error: " + JSON.stringify(res.error))
            else {
                setResolverForm({ name: '' })
                setEditingId(null)
                await loadData()
            }
        } catch (e) {
            alert("System error: " + e)
        } finally {
            setLoading(false)
        }
    }

    function handleEditMK(item: any) {
        setMkForm({ code: item.code, name: item.name, pos: item.pos, machine: item.machine })
        setEditingId(item.id)
    }

    function handleEditCustomer(item: any) {
        setCustomForm({ code: item.code, name: item.name, pos: item.pos, machine: item.machine })
        setEditingId(item.id)
    }

    function handleEditResolver(item: any) {
        setResolverForm({ name: item.name })
        setEditingId(item.id)
    }

    function handleCancelEdit() {
        setEditingId(null)
        setMkForm({ code: '', name: '', pos: '', machine: '' })
        setCustomForm({ code: '', name: '', pos: '', machine: '' })
        setResolverForm({ name: '' })
    }

    async function handleDeleteMK(code: string) {
        if (confirm('ยืนยันการลบข้อมูลสาขา?')) {
            await deleteMKBranch(code)
            loadData()
        }
    }

    async function handleDeleteCustomer(code: string) {
        if (confirm('ยืนยันการลบข้อมูลลูกค้า?')) {
            await deleteCustomer(code)
            loadData()
        }
    }

    async function handleDeleteResolver(id: string) {
        if (confirm('ยืนยันการลบผู้แก้ไข?')) {
            await deleteResolver(id)
            loadData()
        }
    }

    async function handleDownloadTemplate() {
        alert('ฟีเจอร์นี้ถูกปิดใช้งานชั่วคราวเนื่องจากปัญหาด้านความปลอดภัยของระบบ')
    }

    async function handleExport() {
        alert('ฟีเจอร์นี้ถูกปิดใช้งานชั่วคราวเนื่องจากปัญหาด้านความปลอดภัยของระบบ')
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        alert('ฟีเจอร์นี้ถูกปิดใช้งานชั่วคราวเนื่องจากปัญหาด้านความปลอดภัยของระบบ')
        e.target.value = ''
    }

    if (loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    )

    if (!isAuthorized) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card border-0 shadow-lg p-4 p-md-5 rounded-4 bg-white"
                style={{ maxWidth: '400px', width: '90%' }}
            >
                <div className="text-center mb-4">
                    <div className="bg-primary-subtle d-inline-flex p-3 rounded-circle mb-3">
                        <Shield size={32} className="text-primary" />
                    </div>
                    <h2 className="h4 fw-bold mb-1">Admin Login</h2>
                    <p className="text-muted small">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล</p>
                </div>

                <form onSubmit={handleLogin} className="vstack gap-3">
                    <div>
                        <label className="form-label small fw-bold">Username</label>
                        <input
                            type="text"
                            className="form-control py-2 border-light bg-light"
                            placeholder=""
                            value={loginForm.username}
                            onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label small fw-bold">Password</label>
                        <input
                            type="password"
                            className="form-control py-2 border-light bg-light"
                            placeholder=""
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            required
                        />
                    </div>
                    {loginError && <div className="text-danger small text-center">{loginError}</div>}
                    <button type="submit" className="btn btn-primary py-2 fw-bold mt-2 shadow-sm border-0" style={{ background: 'linear-gradient(45deg, #3b82f6, #6366f1)' }}>
                        เข้าสู่ระบบ
                    </button>
                    <Link href="/" className="btn btn-link text-decoration-none text-secondary small text-center mt-2">
                        <ArrowLeft size={14} className="me-1" /> กลับหน้าหลัก
                    </Link>
                </form>
            </motion.div>
        </div>
    )

    return (
        <div className="container py-5" style={{ maxWidth: '1000px' }}>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-5">
                <div>
                    <Link href="/" className="btn btn-link text-decoration-none text-secondary p-0 mb-2 d-inline-flex align-items-center gap-2">
                        <ArrowLeft size={16} /> กลับหน้าหลัก
                    </Link>
                    <h1 className="h3 fw-bold text-dark d-flex align-items-center gap-2">
                        <Shield className="text-primary" /> Admin Management
                    </h1>
                </div>
                <div className="d-flex gap-2">
                    <button
                        onClick={async () => {
                            if (confirm("คุณต้องการ Reset ข้อมูลใน Google Sheets ให้เป็นค่าเริ่มต้นจากระบบใช่หรือไม่? (ข้อมูลเก่าใน Sheet จะถูกล้าง)")) {
                                setLoading(true);
                                try {
                                    const { syncMasterDataToSheets } = await import('../actions');
                                    const res = await syncMasterDataToSheets();
                                    if (res.success) {
                                        alert("Sync ข้อมูลสำเร็จ!");
                                        await loadData();
                                    } else {
                                        alert("Sync Failed: " + res.error);
                                    }
                                } catch (e) {
                                    alert("Error: " + e);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        className="btn btn-outline-warning btn-sm fw-bold"
                    >
                        <Sparkles size={16} className="me-1" /> Reset/Sync Master Data
                    </button>
                    <div className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-bold d-flex align-items-center">
                        Master Data Editor
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="nav nav-pills bg-white p-2 rounded-4 shadow-sm d-inline-flex border overflow-auto" style={{ maxWidth: '100%' }}>
                    <button
                        className={`nav-link rounded-3 px-3 py-2 fw-bold whitespace-nowrap ${tab === 'MK' ? 'active shadow-sm' : 'text-secondary'}`}
                        onClick={() => setTab('MK')}
                        style={tab === 'MK' ? { background: 'linear-gradient(45deg, #3b82f6, #6366f1)' } : {}}
                    >
                        MK Branches {data?.mk?.length > 0 && <span className="badge bg-white text-primary ms-2">{data.mk.length}</span>}
                    </button>
                    <button
                        className={`nav-link rounded-3 px-3 py-2 fw-bold whitespace-nowrap ${tab === 'Customer' ? 'active shadow-sm' : 'text-secondary'}`}
                        onClick={() => setTab('Customer')}
                        style={tab === 'Customer' ? { background: 'linear-gradient(45deg, #f43f5e, #fb7185)' } : {}}
                    >
                        Customers {data?.customer?.length > 0 && <span className="badge bg-white text-danger ms-2">{data.customer.length}</span>}
                    </button>
                    <button
                        className={`nav-link rounded-3 px-3 py-2 fw-bold whitespace-nowrap ${tab === 'Resolver' ? 'active shadow-sm' : 'text-secondary'}`}
                        onClick={() => setTab('Resolver')}
                        style={tab === 'Resolver' ? { background: 'linear-gradient(45deg, #10b981, #34d399)' } : {}}
                    >
                        Resolvers {data?.resolvers?.length > 0 && <span className="badge bg-white text-success ms-2">{data.resolvers.length}</span>}
                    </button>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="btn btn-light border rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
                >
                    <Terminal size={18} className={loading ? 'animate-spin' : ''} /> ดึงข้อมูลใหม่
                </button>
            </div>

            <div className="row g-4">
                {/* Form Section */}
                <div className="col-lg-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100"
                    >
                        <h2 className="h5 fw-bold mb-4 d-flex align-items-center gap-2">
                            <Plus size={20} className="text-primary" />
                            {editingId ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล'}
                            {tab === 'MK' ? 'สาขา' : tab === 'Customer' ? 'ลูกค้า' : 'ผู้แก้ไข'}
                        </h2>

                        {tab === 'Resolver' ? (
                            <div className="vstack gap-3">
                                <div>
                                    <label className="form-label small fw-bold text-secondary">ชื่อ-นามสกุล</label>
                                    <input
                                        className="form-control bg-light border-0 py-2"
                                        value={resolverForm.name}
                                        onChange={(e) => setResolverForm({ name: e.target.value })}
                                        placeholder="ระบุชื่อผู้แก้ไข"
                                    />
                                </div>
                                <button
                                    className="btn w-100 py-2 fw-bold rounded-3 mt-2 shadow-sm border-0 text-white"
                                    onClick={handleAddResolver}
                                    style={{ background: 'linear-gradient(45deg, #10b981, #34d399)' }}
                                >
                                    {editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'} <Save size={18} className="ms-2" />
                                </button>
                                {editingId && (
                                    <button
                                        className="btn btn-light w-100 py-2 fw-bold rounded-3 mt-1 text-secondary border shadow-sm"
                                        onClick={handleCancelEdit}
                                    >
                                        ยกเลิก
                                    </button>
                                )}
                            </div>
                        ) : (
                            // MK & Customer Form
                            <div className="vstack gap-3">
                                <div>
                                    <label className="form-label small fw-bold text-secondary">{tab === 'MK' ? 'รหัสสาขา' : 'ชื่อบริษัท'}</label>
                                    <input
                                        className="form-control bg-light border-0 py-2"
                                        value={tab === 'MK' ? mkForm.code : customForm.name}
                                        onChange={(e) => tab === 'MK' ? setMkForm({ ...mkForm, code: e.target.value }) : setCustomForm({ ...customForm, name: e.target.value })}
                                        placeholder={tab === 'MK' ? "เช่น B001" : "ชื่อบริษัท"}
                                    />
                                </div>
                                <div>
                                    <label className="form-label small fw-bold text-secondary">{tab === 'MK' ? 'ชื่อสาขา' : 'จังหวัด'}</label>
                                    <input
                                        className="form-control bg-light border-0 py-2"
                                        value={tab === 'MK' ? mkForm.name : customForm.code}
                                        onChange={(e) => tab === 'MK' ? setMkForm({ ...mkForm, name: e.target.value }) : setCustomForm({ ...customForm, code: e.target.value })}
                                        placeholder={tab === 'MK' ? "ชื่อสาขา" : "จังหวัด"}
                                    />
                                </div>
                                <div>
                                    <label className="form-label small fw-bold text-secondary">ระบบ POS</label>
                                    <input
                                        className="form-control bg-light border-0 py-2"
                                        value={tab === 'MK' ? mkForm.pos : customForm.pos}
                                        onChange={(e) => tab === 'MK' ? setMkForm({ ...mkForm, pos: e.target.value }) : setCustomForm({ ...customForm, pos: e.target.value })}
                                        placeholder="เวอร์ชั่นระบบ"
                                    />
                                </div>
                                <div>
                                    <label className="form-label small fw-bold text-secondary">เครื่อง (Machine)</label>
                                    <input
                                        className="form-control bg-light border-0 py-2"
                                        value={tab === 'MK' ? mkForm.machine : customForm.machine}
                                        onChange={(e) => tab === 'MK' ? setMkForm({ ...mkForm, machine: e.target.value }) : setCustomForm({ ...customForm, machine: e.target.value })}
                                        placeholder="S/N หรือ ID เครื่อง"
                                    />
                                </div>
                                <button
                                    className="btn btn-primary w-100 py-2 fw-bold rounded-3 mt-2 shadow-sm border-0"
                                    onClick={tab === 'MK' ? handleAddMK : handleAddCustomer}
                                    style={{ background: tab === 'MK' ? 'linear-gradient(45deg, #3b82f6, #6366f1)' : 'linear-gradient(45deg, #f43f5e, #fb7185)' }}
                                >
                                    {editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'} <Save size={18} className="ms-2" />
                                </button>
                                {editingId && (
                                    <button
                                        className="btn btn-light w-100 py-2 fw-bold rounded-3 mt-1 text-secondary border shadow-sm"
                                        onClick={handleCancelEdit}
                                    >
                                        ยกเลิก
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* List Section */}
                <div className="col-lg-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden"
                    >
                        <div className="p-4 d-flex justify-content-between align-items-center border-bottom bg-light bg-opacity-50">
                            <h3 className="h6 fw-bold m-0 text-secondary d-flex align-items-center gap-2">
                                <Monitor size={18} />
                                รายการข้อมูล ({tab === 'MK' ? 'สาขา MK' : tab === 'Customer' ? 'ลูกค้าทั่วไป' : 'ผู้แก้ไข'})
                            </h3>
                            <div className="d-flex gap-2">
                                {/* Only show Import/Export/Template for MK and Customer for now */}
                                {(tab === 'MK' || tab === 'Customer') && (
                                    <>
                                        <button
                                            className="btn btn-white border shadow-sm btn-sm d-flex align-items-center gap-1 fw-bold text-success hover-scale"
                                            onClick={handleDownloadTemplate}
                                            title="Download Excel Template"
                                        >
                                            <FileSpreadsheet size={16} /> Template
                                        </button>
                                        <button
                                            className="btn btn-white border shadow-sm btn-sm d-flex align-items-center gap-1 fw-bold text-primary hover-scale"
                                            onClick={() => fileInputRef.current?.click()}
                                            title="Import from Excel"
                                        >
                                            <Upload size={16} /> Import
                                        </button>
                                        <button
                                            className="btn btn-white border shadow-sm btn-sm d-flex align-items-center gap-1 fw-bold text-dark hover-scale"
                                            onClick={handleExport}
                                            title="Export to Excel"
                                        >
                                            <Download size={16} /> Export
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            hidden
                                            accept=".xlsx, .xls"
                                            onChange={handleFileUpload}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        {tab === 'Resolver' ? (
                                            <>
                                                <th className="px-4 py-3 border-0 small fw-bold text-secondary">ชื่อ-นามสกุล</th>
                                                <th className="px-4 py-3 border-0 text-end">จัดการ</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-3 border-0 small fw-bold text-secondary">{tab === 'MK' ? 'รหัส/ชื่อสาขา' : 'บริษัท/จังหวัด'}</th>
                                                <th className="py-3 border-0 small fw-bold text-secondary">ระบบ POS</th>
                                                <th className="py-3 border-0 small fw-bold text-secondary">เครื่อง</th>
                                                <th className="px-4 py-3 border-0 text-end"></th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tab === 'MK' ? (
                                        data.mk.map((item: any) => (
                                            <tr key={item.code}>
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold">{item.name}</div>
                                                    <div className="small text-muted">{item.code}</div>
                                                </td>
                                                <td className="py-3 small">{item.pos}</td>
                                                <td className="py-3 small">{item.machine}</td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm rounded-pill border-0"
                                                            onClick={() => handleEditMK(item)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm rounded-pill border-0"
                                                            onClick={() => handleDeleteMK(item.code)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : tab === 'Customer' ? (
                                        data.customer.map((item: any) => (
                                            <tr key={item.code}>
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold">{item.name}</div>
                                                    <div className="small text-muted">{item.code}</div>
                                                </td>
                                                <td className="py-3 small">{item.pos}</td>
                                                <td className="py-3 small">{item.machine}</td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm rounded-pill border-0"
                                                            onClick={() => handleEditCustomer(item)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm rounded-pill border-0"
                                                            onClick={() => handleDeleteCustomer(item.code)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Resolver List
                                        data.resolvers.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">
                                                    <div className="fw-bold">{item.name}</div>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm rounded-pill border-0"
                                                            onClick={() => handleEditResolver(item)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm rounded-pill border-0"
                                                            onClick={() => handleDeleteResolver(item.id)}
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
                    </motion.div>
                </div>
            </div >

            <style jsx>{`
                .nav-link { transition: all 0.3s ease; }
                .nav-link.active { color: white !important; }
                .table-hover tbody tr:hover { background-color: rgba(0,0,0,0.01); }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: translateY(-2px); }
                .btn-white { background: white; }
                .btn-white:hover { background: #f8f9fa; }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    )
}
