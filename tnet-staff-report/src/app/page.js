// src/app/page.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StaffReportForm from '@/components/StaffReportForm';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // กรณีผู้ใช้ยังไม่ได้เข้าสู่ระบบ
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-xl shadow-md text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          ยินดีต้อนรับสู่ระบบ T-NET Staff Report
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          ระบบบันทึกรายงานการปฏิบัติงานประจำวัน สำหรับพนักงานและผู้ดูแลระบบ กรุณาเข้าสู่ระบบหรือลงทะเบียนเพื่อเริ่มต้นใช้งาน
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors border"
          >
            ลงทะเบียนพนักงานใหม่
          </Link>
        </div>
      </div>
    );
  }

  // กรณีเข้าสู่ระบบแล้ว ให้แสดงฟอร์มบันทึกการปฏิบัติงาน
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <StaffReportForm />
    </div>
  );
}