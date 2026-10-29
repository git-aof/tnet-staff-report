// src/app/supervisor/page.js
'use client';

import Link from 'next/link';
import { Shield, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SupervisorSearch from '@/components/SupervisorSearch';

export default function SupervisorPage() {
  const { user, userProfile, loading } = useAuth();

  // กำหนด Role และตรวจสอบสิทธิ์การเข้าถึง (เฉพาะ Admin หรือ Supervisor เท่านั้น)
  const userRole = user?.role || userProfile?.role || 'staff';
  const hasAccess = userRole === 'admin' || userRole === 'supervisor';

  // ช่วงกำลังโหลดข้อมูล Auth
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    );
  }

  // กรณีผู้ใช้ยังไม่ได้ล็อกอิน
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            คุณต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin) หรือหัวหน้างาน (Supervisor) เพื่อเข้าถึงหน้านี้
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              ไปที่หน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // กรณีผู้ใช้ไม่มีสิทธิ์ (ไม่ใช่ Admin หรือ Supervisor) ให้แสดงหน้าแจ้งเตือนเหมือน master-data
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">พื้นที่สำหรับผู้ดูแลระบบและหัวหน้างานเท่านั้น</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            คุณเข้าสู่ระบบด้วยสิทธิ์ <strong className="text-gray-800">{userRole}</strong>{' '}
            ซึ่งไม่มีสิทธิ์เข้าถึงหน้าตรวจสอบและอนุมัติงานนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
            (Admin / Supervisor)
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // กรณีมีสิทธิ์ ให้แสดงหน้าตรวจสอบและอนุมัติงาน
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Tab Switcher: แดชบอร์ด VS ตรวจสอบ/อนุมัติงาน */}
      <div className="flex border-b border-slate-200 pb-3 items-center justify-start gap-2">
        <Link
          href="/supervisor/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <LayoutDashboard className="w-4 h-4 text-blue-600" />
          <span>แดชบอร์ดภาพรวม (Dashboard)</span>
        </Link>
        <Link
          href="/supervisor"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-xs transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ตรวจสอบและอนุมัติงาน (Review Reports)</span>
        </Link>
      </div>

      <div className="pb-16">
        <SupervisorSearch />
      </div>
    </div>
  );
}
