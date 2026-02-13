'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, ChevronRight, Zap, ShieldCheck, Heart, FileText } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="container-fluid min-vh-100 py-5">
      <div className="container">
        {/* Header Section */}
        <header className="text-center mb-5 pb-lg-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="d-inline-flex align-items-center gap-2 mb-3 px-4 py-2 bg-white rounded-pill shadow-sm border"
          >
            <Zap size={18} className="text-primary fill-current" />
            <span className="fw-bold text-dark small tracking-wider">HELP DESK PRO <span className="text-primary">V2.0</span></span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="display-3 fw-bold text-dark mb-3 mt-4"
            style={{ letterSpacing: '-1.5px' }}
          >
            <span style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Creatus
            </span> Help Desk
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lead text-secondary mx-auto mb-4 fw-medium"
            style={{ maxWidth: '600px' }}
          >
            ระบบบันทึกและจัดการงานซ่อมบำรุงอัจฉริยะ รวดเร็ว และล้ำสมัย
          </motion.p>
        </header>

        {/* Cards Section */}
        <div className="row g-4 justify-content-center">
          {/* MK Card */}
          <div className="col-12 col-lg-5">
            <motion.div
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="h-100"
            >
              <Link href="/mk" className="text-decoration-none">
                <div className="card h-100 border-0 p-4 p-md-5 bg-white text-center" style={{
                  borderRadius: '25px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                  transition: 'all 0.4s ease'
                }}>
                  <div className="d-flex justify-content-center mb-4">
                    <div className="bg-light p-4 rounded-circle mb-2 shadow-sm" style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LayoutDashboard size={45} className="text-primary" />
                    </div>
                  </div>
                  <h2 className="h2 fw-bold text-dark mb-3">MK Group</h2>
                  <p className="text-muted fs-5 mb-4 px-lg-3">
                    สำหรับพนักงานสาขาและทีมเทคนิค บันทึกเคสปัญหา POS และเครื่องจักรในร้าน
                  </p>
                  <div className="btn btn-primary btn-lg rounded-pill px-5 fw-bold mt-auto shadow-sm" style={{
                    background: 'linear-gradient(45deg, #3b82f6, #6366f1)',
                    border: 'none',
                    padding: '12px 30px'
                  }}>
                    เริ่มต้นใช้งาน <ChevronRight size={18} className="ms-2" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Customer Card */}
          <div className="col-12 col-lg-5">
            <motion.div
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="h-100"
            >
              <Link href="/customer" className="text-decoration-none">
                <div className="card h-100 border-0 p-4 p-md-5 bg-white text-center" style={{
                  borderRadius: '25px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                  transition: 'all 0.4s ease'
                }}>
                  <div className="d-flex justify-content-center mb-4">
                    <div className="bg-light p-4 rounded-circle mb-2 shadow-sm" style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={45} className="text-danger" />
                    </div>
                  </div>
                  <h2 className="h2 fw-bold text-dark mb-3">ลูกค้าทั่วไป</h2>
                  <p className="text-muted fs-5 mb-4 px-lg-3">
                    บริการสำหรับลูกค้าภายนอก แจ้งปัญหาการรับบริการและการใช้งานทั่วไป
                  </p>
                  <div className="btn btn-outline-dark btn-lg rounded-pill px-5 fw-bold mt-auto border-2 hover-bg-light" style={{
                    padding: '12px 30px'
                  }}>
                    แจ้งปัญหา <ChevronRight size={18} className="ms-2" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-5 pt-lg-5 text-center">
          <p className="text-muted small fw-medium">
            © 2026 Help Desk Pro. Proudly built with Next.js 15
            <br />
            <span className="text-primary mt-2 d-inline-block">Trusted by 500+ branches nationwide</span>
          </p>
          {/* Management Section */}
          <div className="mt-5 text-center">
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link href="/report" className="btn btn-white border shadow-sm rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2 transition-all hover-admin-btn">
                <FileText size={18} className="text-secondary" /> Report Management
              </Link>
              <Link href="/admin" className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center gap-2 shadow-sm transition-all hover-admin-btn">
                <ShieldCheck size={18} /> Admin Portal
              </Link>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
          color: #000 !important;
        }
        h1, h2, h3, .fw-black {
          font-weight: 700;
        }
        .card:hover {
          box-shadow: 0 30px 60px rgba(0,0,0,0.08) !important;
          transform: translateY(-5px);
        }
        .hover-admin-btn:hover {
          background: linear-gradient(45deg, #3b82f6, #6366f1) !important;
          color: white !important;
          border-color: transparent !important;
          transform: scale(1.05);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2) !important;
        }
        .transition-all {
          transition: all 0.3s ease !important;
        }
      `}</style>
    </div>
  )
}
