"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db, isFirebaseConfigured } from "@/firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Building,
  Calendar,
  Briefcase,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  FolderPlus,
  Palmtree,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const DEPARTMENTS = [
  "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
  "ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)",
  "ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)",
  "ฝ่ายบริหารโครงการ (Project Management)",
  "ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)",
  "ฝ่ายการตลาดและพัฒนาธุรกิจ (Marketing & Sales)",
  "ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)",
  "ฝ่ายบัญชีและการเงิน (Accounting & Finance)",
];

const WORK_TYPES = [
  { id: "Onsite", label: "🏢 Onsite (เข้าสำนักงาน)", color: "border-blue-500 bg-blue-50/50 text-blue-800" },
  { id: "WFH", label: "🏠 Work from Home", color: "border-emerald-500 bg-emerald-50/50 text-emerald-800" },
  { id: "Client Site", label: "🚗 ไซต์งานลูกค้า / นอกสถานที่", color: "border-purple-500 bg-purple-50/50 text-purple-800" },
  { id: "Hybrid", label: "🔄 Hybrid / อื่นๆ", color: "border-amber-500 bg-amber-50/50 text-amber-800" },
  { id: "Leave", label: "🏖️ ลางาน (Leave)", color: "border-rose-500 bg-rose-50/50 text-rose-800" },
];

const LEAVE_TYPES = [
  "ลาพักผ่อนประจำปี (Annual Leave)",
  "ลาป่วย (Sick Leave)",
  "ลากิจ (Personal Leave)",
  "ลาคลอด / ลาเพื่อเลี้ยงดูบุตร (Maternity / Paternity Leave)",
  "ลาฝึกอบรม / สัมมนา (Training / Education Leave)",
  "ลาอื่นๆ (Other Leave)",
];

const LEAVE_DURATIONS = [
  { id: "full", label: "เต็มวัน (1 วัน - 8 ชม.)", hours: 8 },
  { id: "morning", label: "ครึ่งวันเช้า (08:30 - 12:00)", hours: 4 },
  { id: "afternoon", label: "ครึ่งวันบ่าย (13:00 - 17:30)", hours: 4 },
];

const DEFAULT_PROJECTS = [
  "ระบบ Staff Work Report",
  "Cloud Migration Phase 2",
  "Security Audit ลูกค้าธนาคาร",
  "ระบบบริหารจัดการทรัพยากรบุคคล (HRMS)",
  "งานบริการลูกค้า & Support (MA)",
  "งานประชุมและวางแผนภายใน (Internal)",
  "งานวิจัยและพัฒนาเทคโนโลยีใหม่ (R&D)",
  "อื่นๆ (Other)",
];

export default function StaffReportForm({ onReportSubmitted }) {
  const { userProfile } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  // Projects list state
  const [projectList, setProjectList] = useState(DEFAULT_PROJECTS);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState("");

  // Multi-tasks state
  const [taskList, setTaskList] = useState([
    {
      id: "task-1",
      project: DEFAULT_PROJECTS[0],
      startTime: "08:30",
      endTime: "12:00",
      hours: 3.5,
      taskDetail: "",
      progress: "เสร็จสิ้น (100%)",
    },
    {
      id: "task-2",
      project: DEFAULT_PROJECTS[0],
      startTime: "13:00",
      endTime: "17:30",
      hours: 4.5,
      taskDetail: "",
      progress: "กำลังดำเนินการ (50%)",
    },
  ]);

  // Main Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    position: "",
    reportDate: today,
    workType: "Onsite",
    // ช่วงเวลาทำงาน
    startTime: "08:30",
    endTime: "17:30",
    breakMinutes: 60,
    // กรณีลางาน
    leaveType: LEAVE_TYPES[0],
    leaveDuration: "full",
    leaveReason: "",
    // ปัญหาและแผนงาน
    issuesFaced: "",
    nextDayPlan: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);

  // Derived effective values from formData with userProfile fallback (No setState in effect)
  const effectiveEmployeeId = formData.employeeId || userProfile?.employeeId || "";
  const effectiveEmployeeName = formData.employeeName || userProfile?.name || "";
  const effectiveDepartment = formData.department || userProfile?.department || DEPARTMENTS[0];
  const effectivePosition = formData.position || userProfile?.position || "";

  // คำนวณชั่วโมงทำงานรวมอัตโนมัติจากช่วงเวลา (Derived Value - No setState in effect)
  const calculatedTotalHours = useMemo(() => {
    if (formData.workType === "Leave") {
      const dur = LEAVE_DURATIONS.find((d) => d.id === formData.leaveDuration);
      return dur ? dur.hours : 8;
    }

    if (formData.startTime && formData.endTime) {
      const [startH, startM] = formData.startTime.split(":").map(Number);
      const [endH, endM] = formData.endTime.split(":").map(Number);
      let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes > 240) {
        diffMinutes -= Number(formData.breakMinutes) || 0;
      }
      return Math.max(0, Number((diffMinutes / 60).toFixed(1)));
    }
    return 8;
  }, [formData.startTime, formData.endTime, formData.breakMinutes, formData.workType, formData.leaveDuration]);

  // โหลดรายการโครงการจาก Firestore (Requirement 5)
  useEffect(() => {
    async function loadProjects() {
      if (isFirebaseConfigured()) {
        try {
          const snapshot = await getDocs(collection(db, "projects"));
          if (!snapshot.empty) {
            const fetched = [];
            snapshot.forEach((doc) => {
              if (doc.data().name) fetched.push(doc.data().name);
            });
            if (fetched.length > 0) {
              setProjectList(Array.from(new Set([...DEFAULT_PROJECTS, ...fetched])));
            }
          }
        } catch (e) {
          console.log("Using default project list fallback", e);
        }
      }
    }
    loadProjects();
  }, []);

  // จัดการฟิลด์ทั่วไป
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // จัดการเพิ่มโครงการใหม่
  const handleAddNewProject = async (e) => {
    e.preventDefault();
    const trimmed = newProjectInput.trim();
    if (!trimmed) return;

    if (!projectList.includes(trimmed)) {
      setProjectList((prev) => [trimmed, ...prev]);

      if (isFirebaseConfigured()) {
        try {
          await addDoc(collection(db, "projects"), {
            name: trimmed,
            createdAt: serverTimestamp(),
            createdBy: effectiveEmployeeId || "staff",
          });
        } catch (err) {
          console.error("Could not save project to firestore:", err);
        }
      }
    }

    if (taskList.length > 0) {
      updateTask(0, "project", trimmed);
    }
    setNewProjectInput("");
    setShowAddProjectModal(false);
  };

  // จัดการ Multi-tasks (Requirement 3)
  const addTask = () => {
    setTaskList((prev) => [
      ...prev,
      {
        id: "task-" + Date.now(),
        project: projectList[0] || "ทั่วไป",
        startTime: "13:00",
        endTime: "17:30",
        hours: 4.5,
        taskDetail: "",
        progress: "กำลังดำเนินการ (50%)",
      },
    ]);
  };

  const removeTask = (index) => {
    if (taskList.length <= 1) return;
    setTaskList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTask = (index, field, value) => {
    setTaskList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === "startTime" || field === "endTime") {
        const s = field === "startTime" ? value : next[index].startTime;
        const e = field === "endTime" ? value : next[index].endTime;
        if (s && e) {
          const [sh, sm] = s.split(":").map(Number);
          const [eh, em] = e.split(":").map(Number);
          const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
          next[index].hours = Math.max(0, Number(diff.toFixed(1)));
        }
      }
      return next;
    });
  };

  // การส่งแบบฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    // ตรวจสอบความถูกต้อง
    if (!effectiveEmployeeId.trim() || !effectiveEmployeeName.trim()) {
      setStatusMessage({
        type: "error",
        text: "กรุณาระบุรหัสพนักงาน และชื่อ-นามสกุล",
      });
      setLoading(false);
      return;
    }

    if (formData.workType !== "Leave") {
      const hasEmptyTask = taskList.some((t) => !t.taskDetail.trim());
      if (hasEmptyTask) {
        setStatusMessage({
          type: "error",
          text: "กรุณากรอกรายละเอียดงานในทุกรายการให้ครบถ้วนก่อนบันทึก",
        });
        setLoading(false);
        return;
      }
    }

    const combinedTaskDetails =
      formData.workType === "Leave"
        ? `[ลางาน: ${formData.leaveType}] ระยะเวลา: ${
            formData.leaveDuration === "full" ? "เต็มวัน" : "ครึ่งวัน"
          }\nเหตุผล: ${formData.leaveReason || "ไม่ได้ระบุ"}`
        : taskList
            .map(
              (t, i) =>
                `${i + 1}. [${t.project}] (${t.startTime}-${t.endTime}, ${t.hours} ชม.) - ความคืบหน้า ${t.progress}\n   ${t.taskDetail}`
            )
            .join("\n\n");

    const primaryProject =
      formData.workType === "Leave"
        ? "การลางาน"
        : Array.from(new Set(taskList.map((t) => t.project))).join(", ");

    const payload = {
      employeeId: effectiveEmployeeId.trim(),
      employeeName: effectiveEmployeeName.trim(),
      department: effectiveDepartment,
      position: effectivePosition.trim(),
      reportDate: formData.reportDate,
      workType: formData.workType,
      hoursWorked: Number(calculatedTotalHours) || 8,
      workTimeRange: `${formData.startTime} - ${formData.endTime}`,
      leaveInfo:
        formData.workType === "Leave"
          ? {
              leaveType: formData.leaveType,
              leaveDuration: formData.leaveDuration,
              leaveReason: formData.leaveReason,
            }
          : null,
      tasks: formData.workType === "Leave" ? [] : taskList,
      projectTitle: primaryProject,
      taskDetails: combinedTaskDetails,
      issuesFaced: formData.issuesFaced,
      nextDayPlan: formData.nextDayPlan,
      status: "pending",
      supervisorComment: "",
      reviewedAt: null,
      reviewedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (isFirebaseConfigured()) {
        const docRef = await addDoc(collection(db, "reports"), payload);
        setLastSubmittedId(docRef.id);
        setStatusMessage({
          type: "success",
          text: `บันทึกรายงานประจำวันสำเร็จ! รหัสเอกสาร: ${docRef.id}`,
        });
      } else {
        const dummyId = "DEMO-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        const savedReports = JSON.parse(localStorage.getItem("tnet_mock_reports") || "[]");
        savedReports.unshift({
          ...payload,
          id: dummyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        localStorage.setItem("tnet_mock_reports", JSON.stringify(savedReports));

        setLastSubmittedId(dummyId);
        setStatusMessage({
          type: "warning",
          text: `[Demo Mode] บันทึกรายงานจำลองสำเร็จ (ID: ${dummyId})`,
        });
      }

      if (onReportSubmitted) {
        onReportSubmitted();
      }

      setTaskList([
        {
          id: "task-1",
          project: projectList[0] || "ทั่วไป",
          startTime: "08:30",
          endTime: "12:00",
          hours: 3.5,
          taskDetail: "",
          progress: "เสร็จสิ้น (100%)",
        },
      ]);
      setFormData((prev) => ({
        ...prev,
        issuesFaced: "",
        nextDayPlan: "",
        leaveReason: "",
      }));
    } catch (error) {
      console.error("Firestore Error:", error);
      let errorText = `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`;
      if (
        error?.code === "permission-denied" ||
        error?.message?.includes("insufficient permissions")
      ) {
        errorText =
          "เกิดข้อผิดพลาดสิทธิ์การเข้าถึงฐานข้อมูล (Missing or insufficient permissions): กรุณาตรวจสอบ Firestore Security Rules ใน Firebase Console ให้เปิด allow read, write สำหรับ collection 'reports'";
      }
      setStatusMessage({
        type: "error",
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title Card */}
      <div className="mb-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">
                แบบบันทึกรายงานการปฏิบัติงานประจำวัน
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Staff Daily Work Report — บันทึกผลการทำงาน ช่วงเวลา และรายการโครงการ
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Calendar className="w-3.5 h-3.5" />
              <span>วันที่: {formData.reportDate}</span>
            </span>
          </div>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in duration-200 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{statusMessage.text}</p>
              {lastSubmittedId && (
                <p className="text-xs mt-1 opacity-90">
                  รหัสเอกสารถูกบันทึกลงในฐานข้อมูลเรียบร้อยแล้ว
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ข้อมูลผู้ปฏิบัติงาน (Auto-filled from user profile) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900 text-base">
                1. ข้อมูลผู้ปฏิบัติงาน
              </h2>
            </div>
            {userProfile && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>ดึงจากข้อมูลโปรไฟล์อัตโนมัติ</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสพนักงาน (Employee ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                value={effectiveEmployeeId}
                onChange={handleChange}
                placeholder="เช่น EMP-1042"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-slate-50/50 text-slate-900 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อ - นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="employeeName"
                value={effectiveEmployeeName}
                onChange={handleChange}
                placeholder="เช่น นายพงศกร ประเสริฐสุข"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-slate-50/50 text-slate-900 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สังกัดฝ่าย / แผนก <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  name="department"
                  value={effectiveDepartment}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white text-slate-900 transition-all"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ตำแหน่งงาน (Position)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="position"
                  value={effectivePosition}
                  onChange={handleChange}
                  placeholder="เช่น Software Engineer, System Analyst"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white text-slate-900 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: วันที่และรูปแบบการทำงาน พร้อมช่วงเวลา & ตัวเลือกลางาน */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-base">
              2. วันที่และรูปแบบการปฏิบัติงาน
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                วันที่รายงาน (Report Date) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  name="reportDate"
                  value={formData.reportDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm bg-white text-slate-900 transition-all font-sans"
                />
              </div>
            </div>

            {/* เลือกช่วงเวลาทำงาน */}
            {formData.workType !== "Leave" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ช่วงเวลาทำงานประจำวัน (Work Time Range)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">เริ่ม:</span>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">ถึง:</span>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>หักเวลาพัก 60 นาที</span>
                  <span className="font-semibold text-blue-700">
                    รวมประมาณ {calculatedTotalHours} ชั่วโมง
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ระยะเวลาการลา <span className="text-rose-500">*</span>
                </label>
                <select
                  name="leaveDuration"
                  value={formData.leaveDuration}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs bg-rose-50/40 text-slate-900"
                >
                  {LEAVE_DURATIONS.map((dur) => (
                    <option key={dur.id} value={dur.id}>
                      {dur.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ปุ่มเลือก Work Type (รวมตัวเลือก ลางาน) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              รูปแบบการปฏิบัติงาน / สถานะ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {WORK_TYPES.map((type) => {
                const isSelected = formData.workType === type.id;
                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => setFormData((prev) => ({ ...prev, workType: type.id }))}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer ${
                      isSelected
                        ? `${type.color} ring-2 ring-blue-500/30 shadow-xs scale-[1.01]`
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติมกรณีเลือก "ลางาน" */}
          {formData.workType === "Leave" && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <Palmtree className="w-4 h-4 text-rose-600" />
                <span>บันทึกข้อมูลการลางาน (Leave Details)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทการลา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                  >
                    {LEAVE_TYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เหตุผลการลา / หมายเหตุเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    name="leaveReason"
                    value={formData.leaveReason}
                    onChange={handleChange}
                    placeholder="เช่น ป่วยมีใบรับรองแพทย์, ติดธุระครอบครัว"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: รายละเอียดงานที่ปฏิบัติ (Multi-Tasks List & Project Dropdown) */}
        {formData.workType !== "Leave" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-slate-900 text-base">
                  3. รายละเอียดงานที่ปฏิบัติ ({taskList.length} รายการ)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-all"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มโครงการใหม่</span>
                </button>

                <button
                  type="button"
                  onClick={addTask}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มรายการงาน</span>
                </button>
              </div>
            </div>

            {/* List of Tasks */}
            <div className="space-y-4">
              {taskList.map((task, index) => (
                <div
                  key={task.id}
                  className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 transition-all hover:border-slate-300"
                >
                  {/* Task Header: Title & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        รายการงานที่ {index + 1}
                      </span>
                    </div>

                    {taskList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ลบ</span>
                      </button>
                    )}
                  </div>

                  {/* Task Project & Time Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Project Dropdown */}
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        โครงการ / กิจกรรม <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={task.project}
                        onChange={(e) => updateTask(index, "project", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
                      >
                        {projectList.map((proj) => (
                          <option key={proj} value={proj}>
                            📁 {proj}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Task Start/End Time */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ช่วงเวลาทำงาน
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={task.startTime}
                          onChange={(e) => updateTask(index, "startTime", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white text-slate-900"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={task.endTime}
                          onChange={(e) => updateTask(index, "endTime", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Progress / Status */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ความคืบหน้า
                      </label>
                      <select
                        value={task.progress}
                        onChange={(e) => updateTask(index, "progress", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
                      >
                        <option value="เสร็จสิ้น (100%)">✅ เสร็จสิ้น (100%)</option>
                        <option value="กำลังดำเนินการ (75%)">⚡ กำลังดำเนินการ (75%)</option>
                        <option value="กำลังดำเนินการ (50%)">⏳ กำลังดำเนินการ (50%)</option>
                        <option value="เริ่มต้นทำ (25%)">🌱 เริ่มต้นทำ (25%)</option>
                        <option value="ติดปัญหา / รอดำเนินการ">⚠️ ติดปัญหา / รอดำเนินการ</option>
                      </select>
                    </div>
                  </div>

                  {/* Task Detail textarea */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      รายละเอียดงานที่ปฏิบัติ <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={task.taskDetail}
                      onChange={(e) => updateTask(index, "taskDetail", e.target.value)}
                      placeholder={`ระบุผลการทำงาน เช่น\n- ตรวจสอบระบบเครือข่ายและอัปเดต Firmware สวิตช์หลัก\n- ประชุมสรุปผลการทดสอบร่วมกับลูกค้า`}
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Task Button Bar */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>สามารถเพิ่มรายการงานได้หลายโครงการ แล้วบันทึกลงฐานข้อมูลในคราวเดียว</span>
              <button
                type="button"
                onClick={addTask}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มรายการงานอีก</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 4: ปัญหาที่พบ และ แผนงานวันถัดไป */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-base">
              4. ปัญหาและอุปสรรค / แผนงานวันถัดไป
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ปัญหาหรืออุปสรรคที่พบ (Issues Faced)
              </label>
              <textarea
                name="issuesFaced"
                rows={3}
                value={formData.issuesFaced}
                onChange={handleChange}
                placeholder="ระบุปัญหาที่เกิดขึ้น หรือใส่ 'ไม่มีปัญหา' หากดำเนินงานได้ราบรื่น"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs bg-white text-slate-900 transition-all leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                แผนงานวันถัดไป (Next Day Plan)
              </label>
              <textarea
                name="nextDayPlan"
                rows={3}
                value={formData.nextDayPlan}
                onChange={handleChange}
                placeholder="ระบุสิ่งที่จะทำในวันถัดไป หรือสิ่งที่ต้องติดตามต่อ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs bg-white text-slate-900 transition-all leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {formData.workType === "Leave"
                    ? "บันทึกการลางาน"
                    : `บันทึกรายงาน (${taskList.length} รายการ)`}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal เพิ่มโครงการใหม่ (Requirement 5) */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-600" />
              <span>เพิ่มโครงการใหม่ใน Dropdown</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              เมื่อเพิ่มแล้ว โครงการนี้จะปรากฏใน Dropdown list สำหรับพนักงานทุกคนในระบบ
            </p>

            <form onSubmit={handleAddNewProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโครงการ / กิจกรรม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProjectInput}
                  onChange={(e) => setNewProjectInput(e.target.value)}
                  placeholder="เช่น โครงการพัฒนา AI Assistant T-NET"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  บันทึกโครงการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
