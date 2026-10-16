import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "T-NET Staff Work Report System",
  description: "ระบบบันทึกรายงานการปฏิบัติงานประจำวันของพนักงานและระบบตรวจสอบสำหรับหัวหน้างาน",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
