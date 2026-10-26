"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import StaffReportForm from "@/components/StaffReportForm";
import SupervisorSearch from "@/components/SupervisorSearch";
import { isFirebaseConfigured } from "@/firebase";
import { Key } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("staff");
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const isConfigured = isFirebaseConfigured();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConfigured={isConfigured}
      />

      {/* Notice Banner if Firebase credentials are dummy */}
      {!isConfigured && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-semibold">โหมดทดลองใช้งาน (Demo / Preview Mode):</span>
              <span className="text-amber-800">
                ยังไม่ได้เชื่อมต่อ Firebase API Key ในไฟล์ <code>.env.local</code> ระบบจะบันทึกข้อมูลแบบจำลองเพื่อให้ทดสอบ UI ได้ทันที
              </span>
            </div>
            <button
              onClick={() => setShowConfigGuide(!showConfigGuide)}
              className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              {showConfigGuide ? "ซ่อนคำแนะนำ" : "ดูวิธีเชื่อมต่อ Firebase จริง"}
            </button>
          </div>
        </div>
      )}

      {/* Firebase Setup Guide Drawer */}
      {showConfigGuide && (
        <div className="bg-slate-900 text-slate-100 border-b border-slate-800 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Key className="w-5 h-5" />
              <span>ขั้นตอนการเชื่อมต่อ Firebase Firestore จริง</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <li>
                เปิดคอนโซล <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a> และสร้าง Project ใหม่ (หรือเลือก Project เดิม)
              </li>
              <li>
                ไปที่เมนู <strong>Firestore Database</strong> แล้วกด <strong>Create Database</strong> (เลือกโหมด test หรือ production)
              </li>
              <li>
                ไปที่ <strong>Project Settings</strong> &gt; <strong>General</strong> &gt; ส่วน <strong>Your apps</strong> เลือกไอคอน Web (&lt;/&gt;)
              </li>
              <li>
                คัดลอกค่าคอนฟิกไปใส่ในไฟล์ <code>.env.local</code> ในโฟลเดอร์โปรเจกต์นี้
              </li>
              <li>
                โครงสร้างคอลเลกชันใน Firestore ที่ระบบใช้: <code>reports</code>
              </li>
            </ol>
            <div className="p-3 bg-slate-800/80 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
              NEXT_PUBLIC_FIREBASE_API_KEY=&quot;AIzaSy...&quot;<br />
              NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=&quot;your-app.firebaseapp.com&quot;<br />
              NEXT_PUBLIC_FIREBASE_PROJECT_ID=&quot;your-project-id&quot;<br />
              NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=&quot;your-app.appspot.com&quot;<br />
              NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=&quot;...&quot;<br />
              NEXT_PUBLIC_FIREBASE_APP_ID=&quot;1:...:web:...&quot;
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === "staff" ? (
          <StaffReportForm onReportSubmitted={() => {}} />
        ) : (
          <SupervisorSearch />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">T-NET Staff Work Report</span>
            <span>•</span>
            <span>Next.js App Router + Tailwind CSS + Firebase Firestore</span>
          </div>
          <div>
            <span>ออกแบบตามโครงสร้าง Firestore Collection: </span>
            <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono font-medium">reports</code>
          </div>
        </div>
      </footer>
    </div>
  );
}
