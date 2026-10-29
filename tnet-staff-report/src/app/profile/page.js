// src/app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  BadgeAlert,
  Building2,
  Briefcase,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Sparkles,
} from 'lucide-react';

// รายการแผนกมาตรฐานของ T-NET (Fallback กรณี Firestore ยังไม่มีข้อมูล)
const DEFAULT_DEPARTMENTS = [
  { id: 'dept-1', name: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)', status: 'active' },
  { id: 'dept-2', name: 'ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)', status: 'active' },
  { id: 'dept-3', name: 'ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)', status: 'active' },
  { id: 'dept-4', name: 'ฝ่ายบริหารโครงการ (Project Management)', status: 'active' },
  { id: 'dept-5', name: 'ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)', status: 'active' },
  { id: 'dept-6', name: 'ฝ่ายการตลาดและพัฒนาธุรกิจ (Marketing & Sales)', status: 'active' },
  { id: 'dept-7', name: 'ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)', status: 'active' },
  { id: 'dept-8', name: 'ฝ่ายบัญชีและการเงิน (Accounting & Finance)', status: 'active' },
];

// รายการตำแหน่งมาตรฐานของ T-NET (Fallback)
const DEFAULT_POSITIONS = [
  { id: 'pos-1', name: 'Senior Fullstack Engineer', status: 'active' },
  { id: 'pos-2', name: 'Frontend Developer', status: 'active' },
  { id: 'pos-3', name: 'Backend Developer', status: 'active' },
  { id: 'pos-4', name: 'Cloud & DevOps Engineer', status: 'active' },
  { id: 'pos-5', name: 'Cybersecurity Analyst', status: 'active' },
  { id: 'pos-6', name: 'Project Manager (PM)', status: 'active' },
  { id: 'pos-7', name: 'System Support Specialist', status: 'active' },
  { id: 'pos-8', name: 'HR Specialist', status: 'active' },
  { id: 'pos-9', name: 'เจ้าหน้าที่บัญชีและการเงิน (Accounting Officer)', status: 'active' },
  { id: 'pos-10', name: 'เจ้าหน้าที่การตลาดและพัฒนาธุรกิจ (Business Development)', status: 'active' },
  { id: 'pos-11', name: 'System / Network Administrator', status: 'active' },
  { id: 'pos-12', name: 'QA / Software Tester', status: 'active' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, updateUserAccount } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    position: '',
    customPosition: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showPasswordChangeSection, setShowPasswordChangeSection] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [prevUserKey, setPrevUserKey] = useState(null);
  const currentUserKey = userProfile?.uid || user?.uid || null;

  // ปรับปรุง Form State เมื่อข้อมูล User เปลี่ยน (ตามแนวทาง React: Adjusting state during render)
  if (currentUserKey && currentUserKey !== prevUserKey) {
    setPrevUserKey(currentUserKey);
    const currentName = userProfile?.name || user?.displayName || '';
    const currentEmail = userProfile?.email || user?.email || '';
    const currentEmpId = userProfile?.employeeId || '';
    const currentDept = userProfile?.department || '';
    const currentPos = userProfile?.position || '';
    const isStandardPos = DEFAULT_POSITIONS.some((p) => p.name === currentPos);

    setFormData({
      name: currentName,
      email: currentEmail,
      employeeId: currentEmpId,
      department: currentDept,
      position: currentPos ? (isStandardPos ? currentPos : '__custom__') : '',
      customPosition: isStandardPos ? '' : currentPos,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
  }

  // โหลดรายการแผนกและตำแหน่งจาก Firestore ถ้ามี
  useEffect(() => {
    let isMounted = true;

    const fetchMasterData = async () => {
      if (!isFirebaseConfigured()) return;

      try {
        const [deptSnap, posSnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'positions')),
        ]);

        if (isMounted) {
          if (!deptSnap.empty) {
            const fetchedDepts = deptSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            if (fetchedDepts.length > 0) {
              setDepartments(fetchedDepts);
            }
          }

          if (!posSnap.empty) {
            const fetchedPos = posSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
            if (fetchedPos.length > 0) {
              setPositions(fetchedPos);
            }
          }
        }
      } catch (err) {
        console.warn('Cannot fetch master data from Firestore, using default lists:', err);
      }
    };

    void fetchMasterData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (!userProfile && !user) return;
    const currentName = userProfile?.name || user?.displayName || '';
    const currentEmail = userProfile?.email || user?.email || '';
    const currentEmpId = userProfile?.employeeId || '';
    const currentDept = userProfile?.department || '';
    const currentPos = userProfile?.position || '';
    const isStandardPos = DEFAULT_POSITIONS.some((p) => p.name === currentPos);

    setFormData({
      name: currentName,
      email: currentEmail,
      employeeId: currentEmpId,
      department: currentDept,
      position: currentPos ? (isStandardPos ? currentPos : '__custom__') : '',
      customPosition: isStandardPos ? '' : currentPos,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setError('');
    setSuccess('');
    setShowPasswordChangeSection(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. ตรวจสอบชื่อ-นามสกุล
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    // 2. ตรวจสอบรหัสพนักงาน
    if (!formData.employeeId.trim()) {
      setError('กรุณากรอกรหัสพนักงาน (เช่น EMP-1001 หรือ 6601001)');
      return;
    }

    // 3. ตรวจสอบอีเมล
    if (!formData.email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    // 4. ตรวจสอบแผนก
    if (!formData.department.trim()) {
      setError('กรุณาเลือกแผนก/สังกัดฝ่าย');
      return;
    }

    // 5. ตรวจสอบตำแหน่งงาน
    const effectivePosition =
      formData.position === '__custom__'
        ? formData.customPosition.trim()
        : formData.position.trim();

    if (!effectivePosition) {
      setError('กรุณาระบุตำแหน่งงานให้ครบถ้วน');
      return;
    }

    // 6. ตรวจสอบการเปลี่ยนรหัสผ่าน (ถ้ามีการกรอก)
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }

      if (!formData.currentPassword && isFirebaseConfigured() && !userProfile?.isDemo) {
        setError('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน');
        return;
      }
    }

    // ตรวจสอบกรณีเปลี่ยนอีเมล (ถ้าเปลี่ยนอีเมลและเชื่อมต่อ Firebase จริง จำเป็นต้องใส่ currentPassword)
    const emailChanged =
      user?.email &&
      formData.email.trim().toLowerCase() !== user.email.toLowerCase();

    if (emailChanged && !formData.currentPassword && isFirebaseConfigured() && !userProfile?.isDemo) {
      setError('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนอีเมล');
      return;
    }

    setLoading(true);

    try {
      await updateUserAccount({
        name: formData.name.trim(),
        email: formData.email.trim(),
        employeeId: formData.employeeId.trim(),
        department: formData.department.trim(),
        position: effectivePosition,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined,
      });

      setSuccess('บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว');
      // ล้างช่องรหัสผ่าน
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
      setShowPasswordChangeSection(false);
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกใช้งานแล้วโดยบัญชีอื่น');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('เพื่อความปลอดภัย กรุณาระบุรหัสผ่านปัจจุบัน หรือออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้งเพื่อดำเนินการ');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else {
        setError(err.message || 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  // กรณีผู้ใช้ยังไม่ได้เข้าสู่ระบบ
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl shadow-lg border border-slate-200 text-center space-y-5">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-sm text-slate-600">
          คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถดูและแก้ไขข้อมูลส่วนตัวได้
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            ไปที่หน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  const role = user?.role || userProfile?.role || 'staff';
  const activeDepartments = departments.filter((d) => d.status !== 'inactive');
  const activePositions = positions.filter((p) => p.status !== 'inactive');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/staff"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้าบันทึกรายงาน</span>
        </Link>
        <span className="text-xs text-slate-400">T-NET Staff Management</span>
      </div>

      {/* Profile Overview Card Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar Icon */}
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-3xl shadow-inner shrink-0">
            {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {formData.name || 'ผู้ใช้งาน T-NET'}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : role === 'supervisor'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {role === 'admin'
                  ? '👑 ผู้ดูแลระบบ (Admin)'
                  : role === 'supervisor'
                  ? '🛡️ หัวหน้างาน (Supervisor)'
                  : '👤 พนักงาน (Staff)'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-blue-100/90">
              รหัสพนักงาน: <span className="font-semibold text-white">{formData.employeeId || '-'}</span> | อีเมล: {formData.email}
            </p>
            <p className="text-xs text-blue-200">
              สังกัด: {formData.department || '-'} | ตำแหน่ง: {formData.position === '__custom__' ? formData.customPosition : formData.position || '-'}
            </p>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            แก้ไขข้อมูลส่วนตัวและบัญชีผู้ใช้
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            คุณสามารถแก้ไขข้อมูลชื่อ-นามสกุล, รหัสพนักงาน, อีเมล, แผนก, ตำแหน่ง และรหัสผ่านของคุณได้ที่นี่
          </p>
        </div>

        {/* Section 1: ข้อมูลส่วนตัว */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            ข้อมูลพนักงาน (Staff Details)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  placeholder="เช่น สมชาย ใจมั่นคง"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="employeeId" className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสพนักงาน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BadgeAlert className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  required
                  placeholder="เช่น EMP-1001 หรือ 6601001"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมลองค์กร (สำหรับเข้าสู่ระบบ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="somchai@tnet.co.th"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * หากมีการเปลี่ยนอีเมล ระบบจะต้องการรหัสผ่านปัจจุบันเพื่อยืนยันความปลอดภัย
            </p>
          </div>
        </div>

        {/* Section 2: ข้อมูลแผนกและตำแหน่ง */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            ฝ่ายงานและตำแหน่ง (Department & Position)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-xs font-semibold text-slate-700 mb-1">
                แผนก / สังกัดฝ่าย <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors appearance-none"
                >
                  <option value="">-- กรุณาเลือกแผนก --</option>
                  {activeDepartments.map((d) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-slate-700 mb-1">
                ตำแหน่งงาน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="position"
                  name="position"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors appearance-none"
                >
                  <option value="">-- กรุณาเลือกตำแหน่ง --</option>
                  {activePositions.map((p) => (
                    <option key={p.id || p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__custom__">➕ อื่นๆ (ระบุตำแหน่งเอง)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ช่องระบุตำแหน่งเอง (กรณีเลือก อื่นๆ) */}
          {formData.position === '__custom__' && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 animate-in fade-in">
              <label htmlFor="customPosition" className="block text-xs font-semibold text-blue-900 mb-1">
                ระบุชื่อตำแหน่งงานของคุณ <span className="text-rose-500">*</span>
              </label>
              <input
                id="customPosition"
                type="text"
                name="customPosition"
                required
                placeholder="เช่น Cloud Solution Architect, Data Engineer, ฯลฯ"
                value={formData.customPosition}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-blue-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
              />
            </div>
          )}
        </div>

        {/* Section 3: สิทธิ์การใช้งาน (Read-only Info) */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100/70 text-blue-700 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                สิทธิ์การใช้งานในระบบ (System Authorization Role)
              </div>
              <div className="text-[11px] text-slate-500">
                สิทธิ์ปัจจุบัน:{' '}
                <span className="font-semibold text-blue-700">
                  {role === 'admin'
                    ? 'Admin (ผู้ดูแลระบบ)'
                    : role === 'supervisor'
                    ? 'Supervisor (หัวหน้างาน)'
                    : 'Staff (พนักงานทั่วไป)'}
                </span>{' '}
                (การปรับเปลี่ยนสิทธิ์ต้องดำเนินการโดยผู้ดูแลระบบ)
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: เปลี่ยนรหัสผ่าน (Collapsible / Toggle) */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              ความปลอดภัยและรหัสผ่าน (Security & Password)
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswordChangeSection((prev) => !prev)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showPasswordChangeSection ? 'ซ่อนการเปลี่ยนรหัสผ่าน ▲' : 'ต้องการเปลี่ยนรหัสผ่าน? ▼'}
            </button>
          </div>

          {showPasswordChangeSection && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in">
              <div className="text-xs text-slate-600 font-medium">
                🔑 กำหนดรหัสผ่านใหม่ (หากไม่ต้องการเปลี่ยน ให้ปล่อยว่างไว้)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      aria-label={showNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="confirmNewPassword"
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      name="confirmNewPassword"
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.confirmNewPassword}
                      onChange={handleChange}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      aria-label={showConfirmNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="currentPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านปัจจุบัน <span className="text-rose-500">*</span> (จำเป็นเมื่อเปลี่ยนรหัสผ่านหรืออีเมล)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    placeholder="กรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label={showCurrentPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>คืนค่าเดิม (Reset)</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
