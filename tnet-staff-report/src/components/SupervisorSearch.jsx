// src/components/SupervisorSearch.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db, isFirebaseConfigured } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Search, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DEPARTMENTS } from "./StaffReportForm";

const formatCsvField = (text) => {
  if (!text) return '""';
  const cleanText = String(text).replaceAll('"', '""');
  return `"${cleanText}"`;
};

const getBadgeStyle = (status) => {
  if (status === "approved") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "rejected") return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
};

const getStatusLabel = (status) => {
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ไม่อนุมัติ";
  return "รออนุมัติ";
};

const getProjectTitle = (item) => {
  if (item.projectName) return item.projectName;
  if (item.projectTitle) return item.projectTitle;
  return "ทั่วไป";
};

const getDescriptionText = (item) => {
  if (item.description) return item.description;
  if (item.taskDetails) return item.taskDetails;
  return "-";
};

const getEmployeeDisplayName = (item) => {
  if (item.employeeName) return item.employeeName;
  if (item.userName) return item.userName;
  return "ไม่ระบุชื่อ";
};

const getReportDate = (item) => {
  if (item.date) return item.date;
  if (item.reportDate) return item.reportDate;
  return "-";
};

export default function SupervisorSearch() {
  const { user } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal / Action states
  const [selectedReport, setSelectedReport] = useState(null);
  const [supervisorComment, setSupervisorComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Reload Reports (สำหรับเรียกใช้งานเมื่อ Supervisor อัปเดตสถานะงาน)
  const reloadReports = useCallback(async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const querySnapshot = await getDocs(collection(db, "reports"));
        const fetched = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });

        fetched.sort((a, b) => {
          let dateAStr = "";
          if (a.date) {
            dateAStr = a.date;
          } else if (a.createdAt?.toDate) {
            dateAStr = a.createdAt.toDate().toISOString();
          }

          let dateBStr = "";
          if (b.date) {
            dateBStr = b.date;
          } else if (b.createdAt?.toDate) {
            dateBStr = b.createdAt.toDate().toISOString();
          }

          return dateBStr.localeCompare(dateAStr);
        });

        setReports(fetched);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลครั้งแรกเมื่อ Mount (ไม่มี synchronous setState ใน effect)
  useEffect(() => {
    let isMounted = true;

    const loadInitialReports = async () => {
      try {
        if (isFirebaseConfigured()) {
          const querySnapshot = await getDocs(collection(db, "reports"));
          const fetched = [];
          querySnapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...docSnap.data() });
          });

          fetched.sort((a, b) => {
            let dateAStr = "";
            if (a.date) {
              dateAStr = a.date;
            } else if (a.createdAt?.toDate) {
              dateAStr = a.createdAt.toDate().toISOString();
            }

            let dateBStr = "";
            if (b.date) {
              dateBStr = b.date;
            } else if (b.createdAt?.toDate) {
              dateBStr = b.createdAt.toDate().toISOString();
            }

            return dateBStr.localeCompare(dateAStr);
          });

          if (isMounted) {
            setReports(fetched);
            setLoading(false);
          }
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const matchSearchTerm = useCallback((item, searchLower) => {
    if (!searchLower) return true;
    return (
      item.employeeName?.toLowerCase().includes(searchLower) ||
      item.userName?.toLowerCase().includes(searchLower) ||
      item.employeeId?.toLowerCase().includes(searchLower) ||
      item.projectName?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }, []);

  const filteredReports = reports.filter((item) => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!matchSearchTerm(item, searchLower)) return false;

    if (selectedDept !== "all" && item.department !== selectedDept) return false;
    if (selectedStatus !== "all" && item.status !== selectedStatus) return false;

    return true;
  });

  const handleStatusChange = (status) => {
    if (!selectedReport) return;
    setActionLoading(true);

    void (async () => {
      try {
        if (isFirebaseConfigured()) {
          const reportRef = doc(db, "reports", selectedReport.id);
          await updateDoc(reportRef, {
            status,
            supervisorComment,
            reviewedBy: user?.displayName || user?.email || "Supervisor",
            reviewedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        setSelectedReport(null);
        setSupervisorComment("");
        await reloadReports();
      } catch (err) {
        console.error("Error updating status:", err);
      } finally {
        setActionLoading(false);
      }
    })();
  };

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;

    const headers = [
      "วันที่",
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "แผนก",
      "ตำแหน่ง",
      "รูปแบบงาน",
      "โครงการ/งาน",
      "รายละเอียดงาน",
      "สถานะ",
      "ความเห็นผู้ควบคุมงาน",
    ];

    const rows = filteredReports.map((r) => [
      formatCsvField(r.date || r.reportDate),
      formatCsvField(r.employeeId),
      formatCsvField(r.employeeName || r.userName),
      formatCsvField(r.department),
      formatCsvField(r.position),
      formatCsvField(r.workType),
      formatCsvField(r.projectName || r.projectTitle),
      formatCsvField(r.description || r.taskDetails),
      formatCsvField(r.status),
      formatCsvField(r.supervisorComment),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `staff_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={5} className="py-6 text-center text-gray-500">
            กำลังโหลดข้อมูล...
          </td>
        </tr>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="py-6 text-center text-gray-500">
            ไม่พบข้อมูลรายงาน
          </td>
        </tr>
      );
    }

    return filteredReports.map((item) => {
      const projectTitle = getProjectTitle(item);
      const descriptionText = getDescriptionText(item);
      const employeeName = getEmployeeDisplayName(item);
      const statusLabel = getStatusLabel(item.status);
      const reportDate = getReportDate(item);
      const departmentText = item.department || "-";
      const badgeStyle = getBadgeStyle(item.status);

      return (
        <tr key={item.id} className="hover:bg-slate-50/80">
          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
            {reportDate}
          </td>
          <td className="px-4 py-3">
            <div className="font-semibold text-slate-900">{employeeName}</div>
            <div className="text-[11px] text-slate-500">{departmentText}</div>
          </td>
          <td className="px-4 py-3">
            <div className="font-semibold text-blue-600">{projectTitle}</div>
            <div className="text-slate-600 line-clamp-2 max-w-md">{descriptionText}</div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeStyle}`}>
              {statusLabel}
            </span>
          </td>
          <td className="px-4 py-3 text-center whitespace-nowrap">
            <button
              type="button"
              onClick={() => {
                setSelectedReport(item);
                setSupervisorComment(item.supervisorComment || "");
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              ตรวจสอบ
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>ตรวจสอบและอนุมัติรายงานการปฏิบัติงาน</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisor Audit Panel — ค้นหา กรอง และอนุมัติรายงานพนักงาน
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filteredReports.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>ส่งออกเป็น CSV ({filteredReports.length})</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-6 rounded-2xl border shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-term-input" className="block text-xs font-semibold text-slate-700 mb-1">
              คำค้นหา (ชื่อ / รหัส / โครงการ)
            </label>
            <input
              id="search-term-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="พิมพ์ชื่อพนักงาน หรือชื่อโครงการ..."
              className="w-full px-3.5 py-2 border rounded-xl text-xs bg-white"
            />
          </div>

          <div>
            <label htmlFor="filter-dept-select" className="block text-xs font-semibold text-slate-700 mb-1">
              แผนก / ฝ่าย
            </label>
            <select
              id="filter-dept-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
            >
              <option value="all">-- แผนกทั้งหมด --</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-status-select" className="block text-xs font-semibold text-slate-700 mb-1">
              สถานะการอนุมัติ
            </label>
            <select
              id="filter-status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
            >
              <option value="all">-- สถานะทั้งหมด --</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">วันที่</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">พนักงาน</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">โครงการ / รายละเอียดงาน</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">สถานะ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs">
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Audit Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border p-6 w-full max-w-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              ตรวจสอบรายงานการปฏิบัติงาน
            </h3>

            <div className="space-y-2 text-xs">
              <p><strong>ผู้ปฏิบัติงาน:</strong> {getEmployeeDisplayName(selectedReport)}</p>
              <p><strong>โครงการ:</strong> {getProjectTitle(selectedReport)}</p>
              <p><strong>รายละเอียดงาน:</strong></p>
              <div className="p-3 bg-slate-50 rounded-xl border whitespace-pre-line text-slate-700">
                {getDescriptionText(selectedReport)}
              </div>
            </div>

            <div>
              <label htmlFor="supervisor-comment-textarea" className="block text-xs font-semibold text-slate-700 mb-1">
                ความคิดเห็นของผู้ควบคุมงาน (Supervisor Comment)
              </label>
              <textarea
                id="supervisor-comment-textarea"
                rows={3}
                value={supervisorComment}
                onChange={(e) => setSupervisorComment(e.target.value)}
                placeholder="ระบุข้อเสนอแนะ หรือเหตุผลการอนุมัติ/ปฏิเสธ..."
                className="w-full p-2.5 border rounded-xl text-xs bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 border text-xs font-medium rounded-xl hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("rejected")}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl"
              >
                ไม่อนุมัติ
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange("approved")}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
              >
                อนุมัติรายงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}