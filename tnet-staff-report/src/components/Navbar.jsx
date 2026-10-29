// src/components/Navbar.jsx
'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const emptySubscribe = () => () => {};

export default function Navbar() {
  const { user, userProfile, logout, loading } = useAuth();
  const pathname = usePathname();

  // 🟢 ป้องกัน Hydration Mismatch ระหว่าง Server กับ Client ตามมาตรฐาน React 19
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // ดึงข้อมูล Role จาก user หรือ userProfile
  const role = user?.role || userProfile?.role || 'staff';
  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor';

  // ฟังก์ชันเช็กความถูกต้องของ Active Class ใน Navigation Link
  const isActive = (path) => pathname === path;

  const handleLogout = () => {
    void logout();
  };

  // ในช่วงที่ยังไม่อยู่บน Client (isMounted = false) ให้ซ่อนปุ่มฝั่งที่ขึ้นกับ Auth สภาพแวดล้อม Client ชั่วคราว
  const showAuthMenu = isMounted && !loading && user;
  const showGuestMenu = isMounted && !loading && !user;

  return (
    <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo / Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="font-bold text-lg text-blue-400 hover:text-blue-300 transition-colors">
              T-NET Staff Report
            </Link>

            {/* Menu Links (แสดงเฉพาะเมื่อล็อกอินแล้วบน Client) */}
            {showAuthMenu && (
              <div className="hidden md:flex items-center space-x-2">
                {/* ลิงก์สำหรับพนักงานทุกคน */}
                <Link
                  href="/staff"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/staff')
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  บันทึกงานของฉัน
                </Link>

                {/* หน้าปฏิทินปฏิบัติงาน */}
                <Link
                  href="/calendar"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/calendar')
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                >
                  ปฏิทินปฏิบัติงาน
                </Link>

                {/* ลิงก์สำหรับ Supervisor / Admin */}
                {isAdminOrSupervisor && (
                  <>
                    <Link
                      href="/supervisor/dashboard"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/supervisor/dashboard')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                      แดชบอร์ด
                    </Link>

                    <Link
                      href="/supervisor"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/supervisor')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                      ตรวจสอบ/อนุมัติงาน
                    </Link>

                    <Link
                      href="/admin/master-data"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/master-data')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                      จัดการข้อมูลพื้นฐาน
                    </Link>

                    <Link
                      href="/admin/users"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/users')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                    >
                      จัดการผู้ใช้งาน
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Profile & Logout / Login Buttons */}
          <div className="flex items-center space-x-4">
            {showAuthMenu && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="ดูและแก้ไขข้อมูลส่วนตัว"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/40 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || userProfile?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] sm:max-w-[180px] truncate hidden sm:inline-block">
                    {user.displayName || userProfile?.name || user.email}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {role}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}

            {showGuestMenu && (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm text-slate-300 hover:text-white transition-colors font-medium"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  ลงทะเบียน
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}