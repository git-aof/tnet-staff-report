// src/app/register/page.js
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
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

// รายการแผนกมาตรฐานของ T-NET (สำหรับ Fallback กรณี Firestore ยังไม่มีข้อมูล)
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

// รายการตำแหน่งมาตรฐานของ T-NET (สำหรับ Fallback)
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

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    employeeId: '',
    department: '',
    position: '',
    customPosition: '',
    password: '',
    confirmPassword: '',
  });

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState(DEFAULT_POSITIONS);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูลแผนกและตำแหน่งจาก Firestore ถ้ามี
  useEffect(() => {
    let isMounted = true;

    const loadMasterData = async () => {
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

    void loadMasterData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. ตรวจสอบชื่อ-นามสกุล
    if (!formData.displayName.trim()) {
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

    // 5. ตรวจสอบตำแหน่ง
    const effectivePosition =
      formData.position === '__custom__'
        ? formData.customPosition.trim()
        : formData.position.trim();

    if (!effectivePosition) {
      setError('กรุณาระบุตำแหน่งงานให้ครบถ้วน');
      return;
    }

    // 6. ตรวจสอบรหัสผ่าน
    if (!formData.password || formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.displayName.trim(),
        employeeId: formData.employeeId.trim(),
        department: formData.department.trim(),
        position: effectivePosition,
        role: 'staff',
      });

      setSuccess('ลงทะเบียนสำเร็จ! กำลังนำท่านเข้าสู่ระบบ...');
      setTimeout(() => {
        router.push('/staff');
      }, 1000);
    } catch (err) {
      console.error('Registration Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น');
      } else if (err.code === 'auth/invalid-email') {
        setError('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else {
        setError(err.message || 'ไม่สามารถลงทะเบียนได้ กรุณาตรวจสอบข้อมูลอีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const activeDepartments = departments.filter((d) => d.status !== 'inactive');
  const activePositions = positions.filter((p) => p.status !== 'inactive');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 px-8 py-6 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
            <ShieldCheck className="w-7 h-7 text-blue-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ลงทะเบียนพนักงานใหม่</h1>
          <p className="text-sm text-blue-100/90 mt-1">
            กรุณากรอกข้อมูลส่วนตัวและข้อมูลงานให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งานระบบ
          </p>
        </div>

        {/* Card Body Form */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* 1. ข้อมูลส่วนตัว (ชื่อ-นามสกุล และ รหัสพนักงาน) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="displayName" className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="displayName"
                    type="text"
                    name="displayName"
                    required
                    placeholder="เช่น สมชาย ใจมั่นคง"
                    value={formData.displayName}
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

            {/* 2. อีเมล */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                อีเมล <span className="text-rose-500">*</span>
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
            </div>

            {/* 3. แผนก และ ตำแหน่งงาน */}
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
                  placeholder="เช่น Data Engineer, UX/UI Designer, etc."
                  value={formData.customPosition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-blue-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                />
              </div>
            )}

            {/* 4. รหัสผ่าน และ ยืนยันรหัสผ่าน */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    minLength={6}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* ข้อมูลแนะนำเกี่ยวกับสิทธิ์ */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600">
              💡 บัญชีใหม่จะได้รับสิทธิ์เริ่มต้นเป็น <strong>พนักงาน (Staff)</strong> โดยอัตโนมัติ เพื่อบันทึกรายงานการปฏิบัติงานประจำวัน
            </div>

            {/* ปุ่มส่งฟอร์ม */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังสร้างบัญชีผู้ใช้...</span>
                </>
              ) : (
                <>
                  <span>สร้างบัญชีและลงทะเบียน</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ลิงก์ไปหน้าเข้าสู่ระบบ */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              มีบัญชีผู้ใช้งานอยู่แล้ว?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
