// src/app/admin/users/page.js
'use client';

import React, { Suspense } from 'react';
import MasterDataManager from '@/components/MasterDataManager';

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
          กำลังโหลดหน้าจัดการผู้ใช้งาน...
        </div>
      }
    >
      <MasterDataManager initialTab="users" />
    </Suspense>
  );
}