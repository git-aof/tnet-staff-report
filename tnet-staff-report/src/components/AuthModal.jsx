"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Mail,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogOut,
} from "lucide-react";

export const DEPARTMENTS = [
  "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
  "ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)",
  "ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)",
  "ฝ่ายบริหารโครงการ (Project Management)",
  "ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)",
  "ฝ่ายการตลาดและพัฒนาธุรกิจ (Marketing & Sales)",
  "ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)",
  "ฝ่ายบัญชีและการเงิน (Accounting & Finance)",
];

export default function AuthModal({ isOpen, onClose }) {
  const { userProfile, login, register, logout, quickDemoLogin } = useAuth();
  const [mode, setMode] = useState("signin"); // signin, signup, profile
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("staff"); // staff, supervisor

  if (!isOpen) return null;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await login(email, password);
      setSuccess("เข้าสู่ระบบเรียบร้อยแล้ว");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setError(
        err.code === "auth/invalid-credential"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : `เข้าสู่ระบบไม่สำเร็จ: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !name || !employeeId) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register({
        email,
        password,
        name,
        employeeId,
        department,
        position,
        role,
      });
      setSuccess("ลงทะเบียนและเข้าสู่ระบบสำเร็จ!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "อีเมลนี้มีการใช้งานในระบบแล้ว"
          : `การลงทะเบียนไม่สำเร็จ: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (targetRole) => {
    quickDemoLogin(targetRole);
    setSuccess(`เข้าใช้งานในฐานะ ${targetRole === "supervisor" ? "หัวหน้างาน (Supervisor)" : "พนักงาน (Staff)"} สำเร็จ`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <Shield className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {userProfile
                  ? "ข้อมูลโปรไฟล์ผู้ใช้งาน"
                  : mode === "signin"
                  ? "เข้าสู่ระบบ (Sign In)"
                  : "ลงทะเบียนพนักงานใหม่ (Sign Up)"}
              </h2>
              <p className="text-xs text-blue-100/90">
                ระบบจัดการสิทธิ์และรายงานการปฏิบัติงาน T-NET
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* User already signed in */}
          {userProfile ? (
            <div className="space-y-5">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {userProfile.name ? userProfile.name.charAt(0) : "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">{userProfile.name}</h3>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          userProfile.role === "supervisor"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {userProfile.role === "supervisor" ? "🛡️ หัวหน้างาน (Supervisor)" : "👤 พนักงาน (Staff)"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">รหัส: {userProfile.employeeId}</p>
                    <p className="text-xs text-slate-500">{userProfile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">สังกัดฝ่าย:</span>
                    <span className="font-semibold text-slate-800">{userProfile.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ตำแหน่งงาน:</span>
                    <span className="font-semibold text-slate-800">{userProfile.position || "ไม่ระบุ"}</span>
                  </div>
                </div>
              </div>

              {/* Quick Switch demo account */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    ทดสอบสลับบทบาท (Quick Role Switch):
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitch("staff")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      userProfile.role === "staff"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    👤 เป็น พนักงาน (Staff)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSwitch("supervisor")}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      userProfile.role === "supervisor"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    🛡️ เป็น หัวหน้างาน (Supervisor)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setSuccess("ออกจากระบบแล้ว");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ (Logout)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector for Sign In vs Sign Up */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === "signin"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  เข้าสู่ระบบ (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === "signup"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ลงทะเบียนพนักงาน (Sign Up)
                </button>
              </div>

              {/* Form Content */}
              {mode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      อีเมล (Email)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="staff@tnet.co.th"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รหัสผ่าน (Password)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  >
                    <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Testing Options */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 mb-2 text-center">
                      — หรือทดสอบเข้าใช้งานด่วน (One-Click Demo) —
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSwitch("staff")}
                        className="py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 text-xs font-medium transition-all"
                      >
                        เข้าเป็น: พนักงาน (Staff)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSwitch("supervisor")}
                        className="py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 text-xs font-medium transition-all"
                      >
                        เข้าเป็น: หัวหน้า (Supervisor)
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        รหัสพนักงาน <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="เช่น EMP-1055"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น สมพร รักงาน"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        อีเมลองค์กร <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@tnet.co.th"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        รหัสผ่าน (อย่างน้อย 6 ตัว) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สังกัดฝ่าย / แผนก <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ตำแหน่งงาน (Position)
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="เช่น Frontend Engineer, SOC Analyst"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      บทบาทในระบบ (Role Authorization) <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                          role === "staff"
                            ? "border-blue-500 bg-blue-50/70 text-blue-900 font-semibold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value="staff"
                          checked={role === "staff"}
                          onChange={() => setRole("staff")}
                          className="text-blue-600"
                        />
                        <div className="text-xs">
                          <div>พนักงาน (Staff)</div>
                          <div className="text-[10px] text-slate-500">บันทึกรายงานประจำวัน</div>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                          role === "supervisor"
                            ? "border-indigo-500 bg-indigo-50/70 text-indigo-900 font-semibold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value="supervisor"
                          checked={role === "supervisor"}
                          onChange={() => setRole("supervisor")}
                          className="text-indigo-600"
                        />
                        <div className="text-xs">
                          <div>หัวหน้างาน (Supervisor)</div>
                          <div className="text-[10px] text-slate-500">ตรวจรายงาน & ดูแดชบอร์ด</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 mt-2"
                  >
                    <span>{loading ? "กำลังลงทะเบียน..." : "ลงทะเบียนและเข้าสู่ระบบ"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
