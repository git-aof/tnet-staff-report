// src/app/admin/master-data/page.js
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MasterDataManager from '@/components/MasterDataManager';

function MasterDataContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'departments';

  return <MasterDataManager initialTab={initialTab} />;
}

export default function MasterDataPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
          กำลังโหลดหน้าจัดการข้อมูลพื้นฐาน...
        </div>
      }
    >
      <MasterDataContent />
    </Suspense>
  );
}