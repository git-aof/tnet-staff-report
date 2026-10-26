// src/app/calendar/page.js
'use client';

import dynamic from 'next/dynamic';

const CalendarClient = dynamic(() => import('@/components/CalendarClient'), {
    ssr: false,
    loading: () => <p className="p-4 text-center">กำลังโหลดปฏิทิน...</p>,
});

export default function CalendarPage() {
    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">ปฏิทินแสดงการปฏิบัติงาน</h1>
            <CalendarClient />
        </div>
    );
}