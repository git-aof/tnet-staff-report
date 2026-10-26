// src/app/layout.js
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'T-NET Staff Report',
  description: 'ระบบบันทึกรายงานการปฏิบัติงานประจำวัน',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <main className="py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}