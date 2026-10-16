"use client";

import Navbar from "@/components/Navbar";
import StaffReportForm from "@/components/StaffReportForm";
import { isFirebaseConfigured } from "@/firebase";
import { useRouter } from "next/navigation";

export default function StaffPage() {
  const isConfigured = isFirebaseConfigured();
  const router = useRouter();

  const handleTabChange = (tab) => {
    if (tab === "supervisor") {
      router.push("/supervisor");
    } else {
      router.push("/staff");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab="staff"
        setActiveTab={handleTabChange}
        isConfigured={isConfigured}
      />
      <main className="flex-1 pb-16">
        <StaffReportForm />
      </main>
    </div>
  );
}
