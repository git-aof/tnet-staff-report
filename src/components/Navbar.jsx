"use client";

import React, { useState } from "react";
import {
  FileText,
  Search,
  ShieldAlert,
  CheckCircle2,
  User,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "./AuthModal";

export default function Navbar({ activeTab, setActiveTab, isConfigured }) {
  const { userProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showRoleWarning, setShowRoleWarning] = useState(false);

  const handleTabClick = (tab) => {
    if (tab === "supervisor" && userProfile?.role === "staff") {
      setShowRoleWarning(true);
      setTimeout(() => setShowRoleWarning(false), 3500);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">
                    T-NET Staff Report
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                    Firestore
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  ระบบรายงานการปฏิบัติงานประจำวันและตรวจสอบสำหรับหัวหน้างาน
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => handleTabClick("staff")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "staff"
                    ? "bg-white text-blue-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>หน้าพนักงาน</span>
              </button>

              <button
                onClick={() => handleTabClick("supervisor")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
                  activeTab === "supervisor"
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                } ${userProfile?.role === "staff" ? "opacity-75" : ""}`}
              >
                <Search className="w-4 h-4" />
                <span>หน้าหัวหน้างาน</span>
                {userProfile?.role === "staff" && (
                  <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                )}
              </button>
            </div>

            {/* User Profile & Auth Button */}
            <div className="flex items-center space-x-3">
              {userProfile ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                      {userProfile.name ? userProfile.name.charAt(0) : "U"}
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {userProfile.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span>{userProfile.employeeId}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            userProfile.role === "supervisor"
                              ? "text-purple-600"
                              : "text-blue-600"
                          }`}
                        >
                          {userProfile.role === "supervisor" ? "หัวหน้างาน" : "พนักงาน"}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 hidden sm:block" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ / ลงทะเบียน</span>
                </button>
              )}

              {/* Firebase Connection Pill */}
              <div className="hidden xl:flex items-center">
                {isConfigured ? (
                  <div
                    title="Firebase เชื่อมต่อผ่าน .env.local เรียบร้อย"
                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Firebase</span>
                  </div>
                ) : (
                  <div
                    title="โหมดจำลอง (Demo Mode) ยังไม่ได้ระบุคีย์จริงใน .env.local"
                    className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full"
                  >
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    <span>Demo Mode</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Toast if Staff attempts to access Supervisor Tab */}
        {showRoleWarning && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-2 shadow-inner animate-in slide-in-from-top duration-200">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              จำกัดสิทธิ์เฉพาะบทบาท <strong>หัวหน้างาน (Supervisor)</strong> เท่านั้น — คุณล็อกอินอยู่ในบทบาทพนักงาน
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="ml-2 underline font-bold hover:text-amber-100 cursor-pointer"
            >
              สลับเป็นบทบาทหัวหน้างาน
            </button>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
