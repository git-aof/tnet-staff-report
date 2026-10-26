"use client";

import Navbar from "@/components/Navbar";
import SupervisorSearch from "@/components/SupervisorSearch";
import { isFirebaseConfigured } from "@/firebase";
import { useRouter } from "next/navigation";

export default function SupervisorPage() {
  const isConfigured = isFirebaseConfigured();
  const router = useRouter();

  const handleTabChange = (tab) => {
    if (tab === "staff") {
      router.push("/staff");
    } else {
      router.push("/supervisor");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab="supervisor"
        setActiveTab={handleTabChange}
        isConfigured={isConfigured}
      />
      <main className="flex-1 pb-16">
        <SupervisorSearch />
      </main>
    </div>
  );
}
