// src/app/staff/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import StaffReportForm from '@/components/StaffReportForm';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const getStatusBadgeClass = (status) => {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
};

const getStatusText = (status) => {
  if (status === 'approved') return 'อนุมัติแล้ว';
  if (status === 'rejected') return 'ไม่อนุมัติ';
  return 'รออนุมัติ';
};

const getReportDateText = (item) => {
  if (item.date) return item.date;
  return '-';
};

const getDescriptionText = (item) => {
  if (item.description) return item.description;
  if (item.workDetail) return item.workDetail;
  return '-';
};

export default function StaffPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  // คำนวณ loading แบบ Reactive
  const loading = user ? isFetching : false;

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // ดึงข้อมูลเมื่อ Mount หรือ User เปลี่ยน (ไม่มี synchronous setState ใน effect)
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadStaffData = async () => {
      try {
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const projectsList = projectsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const q = query(
          collection(db, 'reports'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        list.sort((a, b) => {
          let dateAStr = '';
          if (a.date) {
            dateAStr = a.date;
          } else if (a.createdAt?.toDate) {
            dateAStr = a.createdAt.toDate().toISOString();
          }

          let dateBStr = '';
          if (b.date) {
            dateBStr = b.date;
          } else if (b.createdAt?.toDate) {
            dateBStr = b.createdAt.toDate().toISOString();
          }

          return dateBStr.localeCompare(dateAStr);
        });

        if (isMounted) {
          setProjects(projectsList);
          setReports(list);
          setIsFetching(false);
        }
      } catch (err) {
        console.error('Error fetching staff data:', err);
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    void loadStaffData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // ฟังก์ชันโหลดข้อมูลซ้ำเมื่อบันทึกฟอร์มสำเร็จ (เรียกจาก User Event)
  const reloadData = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    try {
      const projectsSnap = await getDocs(collection(db, 'projects'));
      const projectsList = projectsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProjects(projectsList);

      const q = query(
        collection(db, 'reports'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      list.sort((a, b) => {
        let dateAStr = '';
        if (a.date) {
          dateAStr = a.date;
        } else if (a.createdAt?.toDate) {
          dateAStr = a.createdAt.toDate().toISOString();
        }

        let dateBStr = '';
        if (b.date) {
          dateBStr = b.date;
        } else if (b.createdAt?.toDate) {
          dateBStr = b.createdAt.toDate().toISOString();
        }

        return dateBStr.localeCompare(dateAStr);
      });

      setReports(list);
    } catch (err) {
      console.error('Error reloading staff data:', err);
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  const filteredReports = reports.filter((item) => {
    const itemDate = item.date || '';
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    if (selectedProject) {
      const matchProjId = item.projectId === selectedProject;
      const matchProjName = item.projectName === selectedProject || item.project === selectedProject;
      if (!matchProjId && !matchProjName) return false;
    }

    if (selectedStatus && item.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  const handleEdit = (report) => {
    if (report.status !== 'pending') {
      alert('สามารถแก้ไขได้เฉพาะรายการที่ยังไม่อนุมัติเท่านั้น');
      return;
    }
    setEditingReport(report);
  };

  const handleFormSuccess = () => {
    setEditingReport(null);
    void reloadData();
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setSelectedProject('');
    setSelectedStatus('');
  };

  const getProjectNameText = (item) => {
    if (item.projectName) return item.projectName;
    if (item.project) return item.project;

    const matchedProject = projects.find((p) => p.id === item.projectId);
    return matchedProject?.name || '-';
  };

  const renderEditButton = (item) => {
    if (item.status !== 'pending') {
      return null;
    }
    return (
      <button
        type="button"
        onClick={() => handleEdit(item)}
        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
      >
        แก้ไข
      </button>
    );
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <p className="text-center py-4 text-gray-500">กำลังโหลดข้อมูล...</p>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <p className="text-center py-8 text-gray-500">ไม่พบประวัติการบันทึกงานตามเงื่อนไขที่ค้นหา</p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">วันที่</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">โครงการ</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">รายละเอียดงาน</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">สถานะ</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReports.map((item) => {
              const projectName = getProjectNameText(item);
              const descriptionText = getDescriptionText(item);
              const reportDateText = getReportDateText(item);
              const badgeClass = getStatusBadgeClass(item.status);
              const statusText = getStatusText(item.status);

              return (
                <tr key={item.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{reportDateText}</td>
                  <td className="px-4 py-2 text-sm">{projectName}</td>
                  <td className="px-4 py-2 text-sm">{descriptionText}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center whitespace-nowrap text-sm">
                    {renderEditButton(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const hasActiveFilter = Boolean(startDate || endDate || selectedProject || selectedStatus);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">บันทึกการปฏิบัติงานพนักงาน</h1>

      <StaffReportForm
        editingReport={editingReport}
        onSuccess={handleFormSuccess}
      />

      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold">ประวัติการบันทึกงานของฉัน</h2>
          <span className="text-sm text-gray-500">
            พบข้อมูลทั้งหมด {filteredReports.length} รายการ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          <div>
            <label htmlFor="filter-start-date" className="block text-xs font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-2 text-sm rounded-md bg-white"
            />
          </div>

          <div>
            <label htmlFor="filter-end-date" className="block text-xs font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-2 text-sm rounded-md bg-white"
            />
          </div>

          <div>
            <label htmlFor="filter-project" className="block text-xs font-medium text-gray-700 mb-1">
              โครงการ
            </label>
            <select
              id="filter-project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full border p-2 text-sm rounded-md bg-white"
            >
              <option value="">-- โครงการทั้งหมด --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.projectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-gray-700 mb-1">
              สถานะ
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border p-2 text-sm rounded-md bg-white"
            >
              <option value="">-- สถานะทั้งหมด --</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>

          {hasActiveFilter && (
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {renderTableBody()}
      </div>
    </div>
  );
}