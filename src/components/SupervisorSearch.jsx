"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db, isFirebaseConfigured } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  User,
  FileText,
  RefreshCw,
  Download,
  AlertTriangle,
  Eye,
  X,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  PieChart,
  Palmtree,
  Lock,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const DEPARTMENTS = [
  "ทั้งหมด (All Departments)",
  "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
  "ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)",
  "ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)",
  "ฝ่ายบริหารโครงการ (Project Management)",
  "ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)",
  "ฝ่ายการตลาดและพัฒนาธุรกิจ (Marketing & Sales)",
  "ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)",
  "ฝ่ายบัญชีและการเงิน (Accounting & Finance)",
];

const INITIAL_SAMPLE_REPORTS = [
  {
    id: "SAMPLE-001",
    employeeId: "EMP-1001",
    employeeName: "สมชาย ใจมั่นคง",
    department: "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
    position: "Senior Fullstack Engineer",
    reportDate: new Date().toISOString().split("T")[0],
    workType: "WFH",
    hoursWorked: 8,
    workTimeRange: "08:30 - 17:30",
    projectTitle: "ระบบ Staff Work Report",
    tasks: [
      {
        id: "t1",
        project: "ระบบ Staff Work Report",
        startTime: "08:30",
        endTime: "12:00",
        hours: 3.5,
        taskDetail: "ออกแบบและพัฒนา Component หน้าบันทึกรายงานพนักงาน และเชื่อมต่อ Auth",
        progress: "เสร็จสิ้น (100%)",
      },
      {
        id: "t2",
        project: "ระบบ Staff Work Report",
        startTime: "13:00",
        endTime: "17:30",
        hours: 4.5,
        taskDetail: "พัฒนาหน้า Dashboard แผนภูมิสรุปข้อมูลสำหรับหัวหน้างาน",
        progress: "กำลังดำเนินการ (75%)",
      },
    ],
    taskDetails: "1. ออกแบบและพัฒนา Component หน้าบันทึกรายงานพนักงาน\n2. พัฒนาหน้า Dashboard แผนภูมิสรุปข้อมูลสำหรับหัวหน้างาน",
    issuesFaced: "ไม่มีปัญหาในการดำเนินงาน",
    nextDayPlan: "ทดสอบการทำงานร่วมกับระบบ Authen และทำ Unit Test",
    status: "pending",
    supervisorComment: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "SAMPLE-002",
    employeeId: "EMP-1002",
    employeeName: "ศิริพร บุญเสริม",
    department: "ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)",
    position: "Cloud Infrastructure Specialist",
    reportDate: new Date().toISOString().split("T")[0],
    workType: "Onsite",
    hoursWorked: 8.5,
    workTimeRange: "08:30 - 18:00",
    projectTitle: "Cloud Migration Phase 2",
    tasks: [
      {
        id: "t3",
        project: "Cloud Migration Phase 2",
        startTime: "08:30",
        endTime: "12:30",
        hours: 4,
        taskDetail: "มอนิเตอร์ประสิทธิภาพของ Kubernetes Cluster และ Database Replica",
        progress: "เสร็จสิ้น (100%)",
      },
      {
        id: "t4",
        project: "Cloud Migration Phase 2",
        startTime: "13:30",
        endTime: "18:00",
        hours: 4.5,
        taskDetail: "ติดตั้ง SSL Certificate ให้กับ Subdomain ใหม่ และทดสอบ Failover",
        progress: "เสร็จสิ้น (100%)",
      },
    ],
    taskDetails: "1. มอนิเตอร์ประสิทธิภาพของ Kubernetes Cluster\n2. ติดตั้ง SSL Certificate ให้กับ Subdomain ใหม่",
    issuesFaced: "ไม่มีปัญหาที่พบ",
    nextDayPlan: "ประชุมวางแผน Maintenance Window ประจำเดือน",
    status: "approved",
    supervisorComment: "ยอดเยี่ยมมาก ตรวจสอบระบบได้เรียบร้อยดี",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "SAMPLE-003",
    employeeId: "EMP-1003",
    employeeName: "เกรียงไกร วงศ์สุวรรณ",
    department: "ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)",
    position: "SOC Analyst",
    reportDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    workType: "Client Site",
    hoursWorked: 8,
    workTimeRange: "09:00 - 18:00",
    projectTitle: "Security Audit ลูกค้าธนาคาร",
    tasks: [
      {
        id: "t5",
        project: "Security Audit ลูกค้าธนาคาร",
        startTime: "09:00",
        endTime: "18:00",
        hours: 8,
        taskDetail: "เข้าตรวจสอบช่องโหว่ระบบ Network ประจำไตรมาส ณ ไซต์งานลูกค้า",
        progress: "กำลังดำเนินการ (50%)",
      },
    ],
    taskDetails: "เข้าตรวจสอบช่องโหว่ระบบ Network ประจำไตรมาส ณ ไซต์งานลูกค้า",
    issuesFaced: "บางเครื่องมือ Scan ต้องรอการอนุมัติสิทธิ์จากฝั่งลูกค้า",
    nextDayPlan: "ติดตามผลการ Patch ช่องโหว่ของลูกค้า",
    status: "reviewed",
    supervisorComment: "รอเอกสาร Sign-off จากลูกค้าเพิ่มเติม",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "SAMPLE-004",
    employeeId: "EMP-1004",
    employeeName: "พิมพ์มาดา สิทธิโชค",
    department: "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
    position: "UI/UX Designer",
    reportDate: new Date().toISOString().split("T")[0],
    workType: "Leave",
    hoursWorked: 8,
    workTimeRange: "-",
    leaveInfo: {
      leaveType: "ลาพักผ่อนประจำปี (Annual Leave)",
      leaveDuration: "full",
      leaveReason: "ลาพักผ่อนประจำปีตามสิทธิ์",
    },
    projectTitle: "การลางาน",
    tasks: [],
    taskDetails: "[ลางาน: ลาพักผ่อนประจำปี (Annual Leave)] เต็มวัน (8 ชม.)\nเหตุผล: ลาพักผ่อนประจำปีตามสิทธิ์",
    issuesFaced: "-",
    nextDayPlan: "กลับมาประสานงานตรวจแบบ Mockup Design ระบบ HRMS",
    status: "approved",
    supervisorComment: "รับทราบและอนุมัติการลาพักผ่อน",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export default function SupervisorSearch() {
  const { userProfile, quickDemoLogin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating] = useState(false);

  // View state: 'dashboard' หรือ 'table'
  const [activeView, setActiveView] = useState("dashboard");

  // Review Form in Modal
  const [reviewStatus, setReviewStatus] = useState("reviewed");
  const [supervisorComment, setSupervisorComment] = useState("");
  const reviewerName = userProfile?.name
    ? `${userProfile.name} (หัวหน้างาน)`
    : "หัวหน้างาน / ผู้ดูแลระบบ";

  // Filter States (Requirement 6: รายคน, รายโครงการ, ตามช่วงวันที่)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ทั้งหมด (All Departments)");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWorkType, setSelectedWorkType] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all"); // 'all', 'today', '7days', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // โหลดข้อมูลรายงานแบบ Asynchronous ป้องกัน cascading renders
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        if (isFirebaseConfigured()) {
          const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          const fetched = [];
          querySnapshot.forEach((docSnap) => {
            fetched.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          });
          if (!ignore) {
            setReports(fetched.length > 0 ? fetched : INITIAL_SAMPLE_REPORTS);
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 0));
          const stored = localStorage.getItem("tnet_mock_reports");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!ignore) setReports(parsed.length > 0 ? parsed : INITIAL_SAMPLE_REPORTS);
          } else {
            if (!ignore) {
              setReports(INITIAL_SAMPLE_REPORTS);
              localStorage.setItem("tnet_mock_reports", JSON.stringify(INITIAL_SAMPLE_REPORTS));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching reports from Firestore:", error);
        const stored = localStorage.getItem("tnet_mock_reports");
        if (!ignore) setReports(stored ? JSON.parse(stored) : INITIAL_SAMPLE_REPORTS);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isFirebaseConfigured()) {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetched = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setReports(fetched.length > 0 ? fetched : INITIAL_SAMPLE_REPORTS);
      } else {
        const stored = localStorage.getItem("tnet_mock_reports");
        const parsed = stored ? JSON.parse(stored) : null;
        setReports(parsed && parsed.length > 0 ? parsed : INITIAL_SAMPLE_REPORTS);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  // ดึงรายชื่อพนักงานทั้งหมดที่มีในรายงาน เพื่อใช้เป็นตัวเลือกตัวกรอง
  const uniqueEmployees = useMemo(() => {
    const map = new Map();
    reports.forEach((r) => {
      if (r.employeeId && !map.has(r.employeeId)) {
        map.set(r.employeeId, {
          id: r.employeeId,
          name: r.employeeName || r.employeeId,
          department: r.department,
        });
      }
    });
    return Array.from(map.values());
  }, [reports]);

  // ดึงรายชื่อโครงการทั้งหมดที่มีในรายงาน
  const uniqueProjects = useMemo(() => {
    const set = new Set();
    reports.forEach((r) => {
      if (r.tasks && Array.isArray(r.tasks)) {
        r.tasks.forEach((t) => {
          if (t.project) set.add(t.project);
        });
      } else if (r.projectTitle && r.projectTitle !== "การลางาน") {
        set.add(r.projectTitle);
      }
    });
    return Array.from(set);
  }, [reports]);

  // กรองข้อมูลรายงานทั้งหมดตามเงื่อนไขที่เลือก (รวม isDateInRange ไว้ใน useMemo)
  const filteredReports = useMemo(() => {
    const isDateInRange = (reportDate) => {
      if (!reportDate) return true;
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      if (dateRangeFilter === "today") {
        return reportDate === todayStr;
      }
      if (dateRangeFilter === "7days") {
        const past7 = new Date();
        past7.setDate(past7.getDate() - 7);
        return reportDate >= past7.toISOString().split("T")[0];
      }
      if (dateRangeFilter === "month") {
        const currentMonth = todayStr.substring(0, 7);
        return reportDate.startsWith(currentMonth);
      }
      if (dateRangeFilter === "custom") {
        if (customStartDate && reportDate < customStartDate) return false;
        if (customEndDate && reportDate > customEndDate) return false;
        return true;
      }
      return true;
    };
    return reports.filter((report) => {
      // 1. กรองคำค้นหา (Search Term)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const empName = (report.employeeName || "").toLowerCase();
        const empId = (report.employeeId || "").toLowerCase();
        const dept = (report.department || "").toLowerCase();
        const proj = (report.projectTitle || "").toLowerCase();
        const tasks = (report.taskDetails || "").toLowerCase();
        if (
          !empName.includes(term) &&
          !empId.includes(term) &&
          !dept.includes(term) &&
          !proj.includes(term) &&
          !tasks.includes(term)
        ) {
          return false;
        }
      }

      // 2. กรองตามแผนก
      if (
        selectedDepartment !== "ทั้งหมด (All Departments)" &&
        report.department !== selectedDepartment
      ) {
        return false;
      }

      // 3. กรองตามสถานะ
      if (selectedStatus !== "all" && report.status !== selectedStatus) {
        return false;
      }

      // 4. กรองตามรูปแบบการทำงาน
      if (selectedWorkType !== "all" && report.workType !== selectedWorkType) {
        return false;
      }

      // 5. กรองรายคน (Requirement 6)
      if (selectedEmployee !== "all" && report.employeeId !== selectedEmployee) {
        return false;
      }

      // 6. กรองรายโครงการ (Requirement 6)
      if (selectedProject !== "all") {
        let hasProj = false;
        if (report.tasks && Array.isArray(report.tasks)) {
          hasProj = report.tasks.some((t) => t.project === selectedProject);
        } else if (report.projectTitle) {
          hasProj = report.projectTitle.includes(selectedProject);
        }
        if (!hasProj) return false;
      }

      // 7. กรองตามช่วงวันที่ (Requirement 6)
      if (!isDateInRange(report.reportDate)) {
        return false;
      }

      return true;
    });
  }, [
    reports,
    searchTerm,
    selectedDepartment,
    selectedStatus,
    selectedWorkType,
    selectedEmployee,
    selectedProject,
    dateRangeFilter,
    customStartDate,
    customEndDate,
  ]);

  // คำนวณข้อมูลสถิติและข้อมูลสำหรับแผนภูมิ (Requirement 6)
  const stats = useMemo(() => {
    const total = filteredReports.length;
    const pending = filteredReports.filter((r) => r.status === "pending").length;
    const reviewed = filteredReports.filter((r) => r.status === "reviewed").length;
    const approved = filteredReports.filter((r) => r.status === "approved").length;
    const leaveCount = filteredReports.filter((r) => r.workType === "Leave").length;
    const totalHours = filteredReports.reduce(
      (sum, r) => sum + (Number(r.hoursWorked) || 0),
      0
    );

    // 1. สรุปรายโครงการ (Project breakdown)
    const projectHoursMap = {};
    const projectCountMap = {};
    filteredReports.forEach((r) => {
      if (r.workType === "Leave") return;

      if (r.tasks && Array.isArray(r.tasks) && r.tasks.length > 0) {
        r.tasks.forEach((t) => {
          const pName = t.project || "ทั่วไป";
          const h = Number(t.hours) || Number(r.hoursWorked) / r.tasks.length || 0;
          projectHoursMap[pName] = (projectHoursMap[pName] || 0) + h;
          projectCountMap[pName] = (projectCountMap[pName] || 0) + 1;
        });
      } else {
        const pName = r.projectTitle || "ทั่วไป";
        const h = Number(r.hoursWorked) || 0;
        projectHoursMap[pName] = (projectHoursMap[pName] || 0) + h;
        projectCountMap[pName] = (projectCountMap[pName] || 0) + 1;
      }
    });

    const projectStats = Object.keys(projectHoursMap)
      .map((name) => ({
        name,
        hours: Number(projectHoursMap[name].toFixed(1)),
        tasks: projectCountMap[name] || 1,
        percentage:
          totalHours > 0
            ? Math.round((projectHoursMap[name] / totalHours) * 100)
            : 0,
      }))
      .sort((a, b) => b.hours - a.hours);

    // 2. สรุปรายคน (Employee breakdown)
    const employeeMap = {};
    filteredReports.forEach((r) => {
      const eId = r.employeeId || "UNKNOWN";
      if (!employeeMap[eId]) {
        employeeMap[eId] = {
          employeeId: eId,
          name: r.employeeName || eId,
          department: r.department,
          hours: 0,
          reportsCount: 0,
          approvedCount: 0,
          leaveCount: 0,
        };
      }
      employeeMap[eId].hours += Number(r.hoursWorked) || 0;
      employeeMap[eId].reportsCount += 1;
      if (r.status === "approved") employeeMap[eId].approvedCount += 1;
      if (r.workType === "Leave") employeeMap[eId].leaveCount += 1;
    });

    const employeeStats = Object.values(employeeMap)
      .map((e) => ({
        ...e,
        hours: Number(e.hours.toFixed(1)),
      }))
      .sort((a, b) => b.hours - a.hours);

    // 3. สรุปสัดส่วนรูปแบบการทำงาน (Work Types)
    const workTypeMap = { Onsite: 0, WFH: 0, "Client Site": 0, Hybrid: 0, Leave: 0 };
    filteredReports.forEach((r) => {
      if (workTypeMap[r.workType] !== undefined) {
        workTypeMap[r.workType] += 1;
      } else {
        workTypeMap.Hybrid += 1;
      }
    });

    return {
      total,
      pending,
      reviewed,
      approved,
      leaveCount,
      totalHours,
      projectStats,
      employeeStats,
      workTypeMap,
    };
  }, [filteredReports]);

  // อัปเดตการตรวจรายงาน
  const handleUpdateReview = async () => {
    if (!selectedReport) return;
    setUpdating(true);
    try {
      if (
        isFirebaseConfigured() &&
        !selectedReport.id.startsWith("SAMPLE-") &&
        !selectedReport.id.startsWith("DEMO-")
      ) {
        const reportDocRef = doc(db, "reports", selectedReport.id);
        await updateDoc(reportDocRef, {
          status: reviewStatus,
          supervisorComment: supervisorComment,
          reviewedBy: reviewerName,
          reviewedAt: serverTimestamp(),
        });
      } else {
        // อัปเดต Mock Data
        const updated = reports.map((r) => {
          if (r.id === selectedReport.id) {
            return {
              ...r,
              status: reviewStatus,
              supervisorComment: supervisorComment,
              reviewedBy: reviewerName,
              reviewedAt: new Date().toISOString(),
            };
          }
          return r;
        });
        setReports(updated);
        localStorage.setItem("tnet_mock_reports", JSON.stringify(updated));
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? {
                ...r,
                status: reviewStatus,
                supervisorComment: supervisorComment,
                reviewedBy: reviewerName,
                reviewedAt: new Date().toISOString(),
              }
            : r
        )
      );

      setSelectedReport(null);
    } catch (error) {
      console.error("Error updating review:", error);
      alert(`ไม่สามารถบันทึกผลการตรวจสอบได้: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // ส่งออก CSV
  const handleExportCSV = () => {
    if (filteredReports.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    const headers = [
      "รหัสพนักงาน",
      "ชื่อ-นามสกุล",
      "แผนก",
      "ตำแหน่ง",
      "วันที่รายงาน",
      "รูปแบบงาน",
      "ชั่วโมงงาน",
      "โครงการ",
      "รายละเอียดงาน",
      "ปัญหาที่พบ",
      "แผนงานวันถัดไป",
      "สถานะ",
      "ความเห็นหัวหน้างาน",
      "ผู้ตรวจสอบ",
    ];

    const rows = filteredReports.map((r) => [
      `"${r.employeeId || ""}"`,
      `"${r.employeeName || ""}"`,
      `"${r.department || ""}"`,
      `"${r.position || ""}"`,
      `"${r.reportDate || ""}"`,
      `"${r.workType || ""}"`,
      `"${r.hoursWorked || 0}"`,
      `"${(r.projectTitle || "").replace(/"/g, '""')}"`,
      `"${(r.taskDetails || "").replace(/"/g, '""')}"`,
      `"${(r.issuesFaced || "").replace(/"/g, '""')}"`,
      `"${(r.nextDayPlan || "").replace(/"/g, '""')}"`,
      `"${r.status || "pending"}"`,
      `"${(r.supervisorComment || "").replace(/"/g, '""')}"`,
      `"${r.reviewedBy || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `T-NET_Staff_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ตรวจสอบสิทธิ์: ถ้าล็อกอินเป็น Staff แสดงหน้าแจ้งเตือนการจำกัดสิทธิ์ (Requirement 1)
  if (userProfile && userProfile.role === "staff") {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              หน้านี้จำกัดสิทธิ์เฉพาะหัวหน้างาน (Supervisor Access Only)
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              คุณกำลังเข้าใช้งานด้วยบัญชีพนักงาน (Staff: <strong>{userProfile.name}</strong>, รหัส{" "}
              {userProfile.employeeId}) ซึ่งไม่มีสิทธิ์เข้าถึงหน้าตรวจสอบและแดชบอร์ดสรุปผล
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => quickDemoLogin("supervisor")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>สลับเป็นบัญชีหัวหน้างาน (Switch to Supervisor)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header & View Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                ระบบตรวจสอบรายงานและแดชบอร์ดสรุปข้อมูล (Supervisor Portal)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ตรวจสอบผลการปฏิบัติงาน อนุมัติรายงานประจำวัน และวิเคราะห์ข้อมูลชั่วโมงทำงาน
            </p>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* View Switcher: Dashboard vs Table */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === "dashboard"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>แดชบอร์ด & แผนภูมิ</span>
              </button>
              <button
                onClick={() => setActiveView("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === "table"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ตารางรายงาน ({filteredReports.length})</span>
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">รายงานทั้งหมด</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ฉบับตามตัวกรอง</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-xs font-medium">รอการตรวจสอบ</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">ฉบับรอตรวจ</div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/60">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-medium">การลางาน</span>
              <Palmtree className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-900">{stats.leaveCount}</div>
            <div className="text-[11px] text-rose-600/80 mt-0.5">รายการลางาน</div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/60">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-xs font-medium">รวมชั่วโมงงาน</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">{stats.totalHours.toFixed(1)}</div>
            <div className="text-[11px] text-indigo-600/80 mt-0.5">ชั่วโมงการทำงาน</div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar (Requirement 6: รายคน, รายโครงการ, ตามช่วงวันที่) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-800">
              ตัวกรองข้อมูล (Filters: รายคน, รายโครงการ, ช่วงวันที่)
            </h2>
          </div>
          {(selectedEmployee !== "all" ||
            selectedProject !== "all" ||
            dateRangeFilter !== "all" ||
            selectedDepartment !== "ทั้งหมด (All Departments)" ||
            selectedStatus !== "all" ||
            searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDepartment("ทั้งหมด (All Departments)");
                setSelectedStatus("all");
                setSelectedWorkType("all");
                setSelectedEmployee("all");
                setSelectedProject("all");
                setDateRangeFilter("all");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. กรองตามช่วงวันที่ (Date Range Filter) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              📅 ช่วงวันที่ (Date Range)
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
            >
              <option value="all">ทั้งหมด (All Dates)</option>
              <option value="today">เฉพาะวันนี้ (Today)</option>
              <option value="7days">7 วันล่าสุด (Past 7 Days)</option>
              <option value="month">เดือนนี้ (This Month)</option>
              <option value="custom">กำหนดช่วงวันที่เอง (Custom)...</option>
            </select>
          </div>

          {/* 2. กรองรายคน (Employee Filter) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              👤 กรองรายคน (Staff Member)
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
            >
              <option value="all">พนักงานทุกคน (All Staff)</option>
              {uniqueEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>
          </div>

          {/* 3. กรองรายโครงการ (Project Filter) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              📁 กรองรายโครงการ (Project)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
            >
              <option value="all">ทุกโครงการ (All Projects)</option>
              {uniqueProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* 4. กรองตามแผนก */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              🏢 แผนก / ฝ่าย (Department)
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker (if selected) */}
        {dateRangeFilter === "custom" && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs flex-wrap animate-in fade-in duration-150">
            <span className="font-semibold text-slate-700">ระบุช่วงวันที่:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">ตั้งแต่</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">ถึง</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>
          </div>
        )}

        {/* Search input & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาข้อความ, ชื่องาน, รายละเอียดงาน, ปัญหาที่พบ..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
            >
              <option value="all">สถานะทั้งหมด (All Status)</option>
              <option value="pending">⏳ รอตรวจสอบ (Pending)</option>
              <option value="reviewed">👀 ตรวจแล้ว (Reviewed)</option>
              <option value="approved">✅ อนุมัติแล้ว (Approved)</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: DASHBOARD & CHARTS (Requirement 6) */}
      {activeView === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: แผนภูมิสรุปรายโครงการ (Projects Breakdown) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    สรุปชั่วโมงงานและสัดส่วนแยกตามโครงการ (Projects Breakdown)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {stats.projectStats.length} โครงการ
                </span>
              </div>

              {stats.projectStats.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ไม่มีข้อมูลโครงการตามตัวกรองที่เลือก
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.projectStats.map((item, idx) => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate max-w-[260px]">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span>{item.name}</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500 text-[11px]">
                            {item.tasks} รายการ
                          </span>
                          <span className="font-bold text-indigo-700">
                            {item.hours} ชม. ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart 2: แผนภูมิสรุปรายคน (Employee Workload & Hours Ranking) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    สรุปชั่วโมงทำงานและผลงานรายคน (Staff Ranking & Workload)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {stats.employeeStats.length} คน
                </span>
              </div>

              {stats.employeeStats.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ไม่มีข้อมูลพนักงานตามตัวกรองที่เลือก
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {stats.employeeStats.map((emp, index) => {
                    const maxHours = stats.employeeStats[0]?.hours || 1;
                    const percent = Math.round((emp.hours / maxHours) * 100);
                    return (
                      <div
                        key={emp.employeeId}
                        className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{emp.name}</div>
                              <div className="text-[10px] text-slate-500">{emp.employeeId}</div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-blue-700 text-xs">
                              {emp.hours} ชม.
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {emp.reportsCount} รายงาน (อนุมัติ {emp.approvedCount})
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chart 3 & 4: รูปแบบการทำงาน & สถิติการลางาน */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* สัดส่วนรูปแบบการทำงาน (Work Types & Leave Distribution) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <PieChart className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  สัดส่วนรูปแบบการทำงาน & การลา
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: "🏢 Onsite (เข้าสำนักงาน)", count: stats.workTypeMap.Onsite, color: "bg-blue-500" },
                  { label: "🏠 Work from Home", count: stats.workTypeMap.WFH, color: "bg-emerald-500" },
                  { label: "🚗 ไซต์งานลูกค้า / นอกสถานที่", count: stats.workTypeMap["Client Site"], color: "bg-purple-500" },
                  { label: "🔄 Hybrid / อื่นๆ", count: stats.workTypeMap.Hybrid, color: "bg-amber-500" },
                  { label: "🏖️ ลางาน (Leave)", count: stats.workTypeMap.Leave, color: "bg-rose-500" },
                ].map((wt) => {
                  const pct = stats.total > 0 ? Math.round((wt.count / stats.total) * 100) : 0;
                  return (
                    <div key={wt.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 font-medium">{wt.label}</span>
                        <span className="font-bold text-slate-900">
                          {wt.count} วัน ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${wt.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* อุปสรรคและปัญหาที่ทีมรายงาน (Issues & Blockers Feed) */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    ประเด็นปัญหาและอุปสรรคที่ทีมรายงานล่าสุด (Issues & Blockers)
                  </h3>
                </div>
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                  หัวหน้าควรติดตาม
                </span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {filteredReports
                  .filter((r) => r.issuesFaced && r.issuesFaced !== "ไม่มีปัญหา" && r.issuesFaced !== "-")
                  .slice(0, 5)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {r.employeeName} ({r.employeeId})
                        </span>
                        <span className="text-[10px] text-slate-500">{r.reportDate}</span>
                      </div>
                      <p className="text-slate-700">{r.issuesFaced}</p>
                    </div>
                  ))}
                {filteredReports.filter(
                  (r) => r.issuesFaced && r.issuesFaced !== "ไม่มีปัญหา" && r.issuesFaced !== "-"
                ).length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    ไม่พบรายงานประเด็นปัญหาหรืออุปสรรคในช่วงเวลานี้ 👍
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: REPORTS TABLE (Review & Management) */}
      {(activeView === "table" || activeView === "dashboard") && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>รายการรายงานการปฏิบัติงาน ({filteredReports.length} รายการ)</span>
            </h3>
            <span className="text-xs text-slate-500">
              คลิก &quot;ตรวจสอบ&quot; เพื่อดูรายละเอียดและอนุมัติงาน
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              กำลังโหลดข้อมูลรายงานจาก Firestore...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs space-y-2">
              <p className="font-semibold text-slate-600">ไม่พบรายงานตรงกับเงื่อนไขที่เลือก</p>
              <p className="text-slate-400">ลองปรับเปลี่ยนตัวกรองค้นหาด้านบน</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">วันที่ / เวลา</th>
                    <th className="py-3 px-4">ผู้ปฏิบัติงาน</th>
                    <th className="py-3 px-4">รูปแบบงาน</th>
                    <th className="py-3 px-4">โครงการ & รายละเอียดงาน</th>
                    <th className="py-3 px-4 text-center">ชั่วโมง</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        <div className="font-bold">{report.reportDate}</div>
                        <div className="text-[10px] text-slate-400">
                          {report.workTimeRange || "08:30 - 17:30"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{report.employeeName}</div>
                        <div className="text-[10px] text-slate-500">
                          {report.employeeId} • {report.department}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            report.workType === "Leave"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : report.workType === "WFH"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : report.workType === "Onsite"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          }`}
                        >
                          {report.workType === "Leave"
                            ? "🏖️ ลางาน"
                            : report.workType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 truncate">
                          {report.projectTitle || "ทั่วไป"}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {report.tasks && report.tasks.length > 0
                            ? `${report.tasks.length} รายการ: ${report.tasks[0]?.taskDetail}`
                            : report.taskDetails}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                        {report.hoursWorked}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            report.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : report.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {report.status === "approved"
                            ? "✅ อนุมัติแล้ว"
                            : report.status === "reviewed"
                            ? "👀 ตรวจแล้ว"
                            : "⏳ รอตรวจ"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setReviewStatus(report.status || "reviewed");
                            setSupervisorComment(report.supervisorComment || "");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ตรวจสอบ</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review & Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-base">
                  ตรวจสอบรายงานการปฏิบัติงาน
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Employee & Date info card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {selectedReport.employeeName} ({selectedReport.employeeId})
                    </h4>
                    <p className="text-slate-500">
                      {selectedReport.department} • {selectedReport.position || "ไม่ระบุตำแหน่ง"}
                    </p>
                  </div>
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-full text-[11px] ${
                      selectedReport.workType === "Leave"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {selectedReport.workType === "Leave"
                      ? "🏖️ ลางาน"
                      : `🏢 ${selectedReport.workType}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-600">
                  <span>วันที่: <strong>{selectedReport.reportDate}</strong></span>
                  <span>ช่วงเวลา: <strong>{selectedReport.workTimeRange || "-"}</strong> ({selectedReport.hoursWorked} ชม.)</span>
                </div>
              </div>

              {/* Tasks Breakdown list */}
              {selectedReport.workType !== "Leave" && selectedReport.tasks && selectedReport.tasks.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>รายการงานที่ปฏิบัติ ({selectedReport.tasks.length} รายการ):</span>
                  </h5>
                  <div className="space-y-2.5">
                    {selectedReport.tasks.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1"
                      >
                        <div className="flex justify-between items-center font-bold text-slate-800">
                          <span>
                            {idx + 1}. 📁 {t.project}
                          </span>
                          <span className="text-indigo-600 text-[11px]">
                            {t.startTime} - {t.endTime} ({t.hours} ชม.) • {t.progress}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {t.taskDetail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs">รายละเอียดงานที่ปฏิบัติ:</h5>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-line text-slate-700 leading-relaxed">
                    {selectedReport.taskDetails}
                  </div>
                </div>
              )}

              {/* Issues & Next day plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1">
                  <span className="font-bold text-amber-900 block">⚠️ ปัญหาและอุปสรรค:</span>
                  <p className="text-slate-700">{selectedReport.issuesFaced || "ไม่มีปัญหา"}</p>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 space-y-1">
                  <span className="font-bold text-blue-900 block">🎯 แผนงานวันถัดไป:</span>
                  <p className="text-slate-700">{selectedReport.nextDayPlan || "ไม่ได้ระบุ"}</p>
                </div>
              </div>

              {/* Supervisor Review Input */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <h5 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>ผลการตรวจสอบและความเห็นของหัวหน้างาน</span>
                </h5>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pending", label: "⏳ รอตรวจ" },
                    { id: "reviewed", label: "👀 ตรวจแล้ว" },
                    { id: "approved", label: "✅ อนุมัติเรียบร้อย" },
                  ].map((st) => (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => setReviewStatus(st.id)}
                      className={`py-2 px-2 text-center rounded-xl font-semibold border transition-all text-xs cursor-pointer ${
                        reviewStatus === st.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ข้อเสนอแนะ / ความเห็นของหัวหน้างาน:
                  </label>
                  <textarea
                    rows={2}
                    value={supervisorComment}
                    onChange={(e) => setSupervisorComment(e.target.value)}
                    placeholder="พิมพ์ความเห็นหรือคำแนะนำสำหรับพนักงาน..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleUpdateReview}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                {updating ? "กำลังบันทึก..." : "บันทึกผลการตรวจสอบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
