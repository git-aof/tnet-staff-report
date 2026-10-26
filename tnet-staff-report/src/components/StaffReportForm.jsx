// src/components/StaffReportForm.jsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db, isFirebaseConfigured } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
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
  Save,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const DEPARTMENTS = [
  'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)',
  'ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)',
  'ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)',
  'ฝ่ายบริหารโครงการ (Project Management)',
  'ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)',
  'ฝ่ายการตลาดและพัฒนาธุรกิจ (Marketing & Sales)',
  'ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)',
  'ฝ่ายบัญชีและการเงิน (Accounting & Finance)',
];

const WORK_TYPES = [
  { id: 'Onsite', label: '🏢 Onsite (เข้าสำนักงาน)', color: 'border-blue-500 bg-blue-50/50 text-blue-800' },
  { id: 'WFH', label: '🏠 Work from Home', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-800' },
  { id: 'Client Site', label: '🚗 ไซต์งานลูกค้า / นอกสถานที่', color: 'border-purple-500 bg-purple-50/50 text-purple-800' },
  { id: 'Hybrid', label: '🔄 Hybrid / อื่นๆ', color: 'border-amber-500 bg-amber-50/50 text-amber-800' },
  { id: 'Leave', label: '🏖️ ลางาน (Leave)', color: 'border-rose-500 bg-rose-50/50 text-rose-800' },
];

const LEAVE_TYPES = [
  'ลาพักผ่อนประจำปี (Annual Leave)',
  'ลาป่วย (Sick Leave)',
  'ลากิจ (Personal Leave)',
  'ลาคลอด / ลาเพื่อเลี้ยงดูบุตร (Maternity / Paternity Leave)',
  'ลาฝึกอบรม / สัมมนา (Training / Education Leave)',
  'ลาอื่นๆ (Other Leave)',
];

const LEAVE_DURATIONS = [
  { id: 'full', label: 'เต็มวัน (1 วัน - 8 ชม.)', hours: 8 },
  { id: 'morning', label: 'ครึ่งวันเช้า (08:30 - 12:00)', hours: 4 },
  { id: 'afternoon', label: 'ครึ่งวันบ่าย (13:00 - 17:30)', hours: 4 },
];

const DEFAULT_PROJECTS = [
  'ระบบ Staff Work Report',
  'Cloud Migration Phase 2',
  'Security Audit ลูกค้าธนาคาร',
  'ระบบบริหารจัดการทรัพยากรบุคคล (HRMS)',
  'งานบริการลูกค้า & Support (MA)',
  'งานประชุมและวางแผนภายใน (Internal)',
  'งานวิจัยและพัฒนาเทคโนโลยีใหม่ (R&D)',
  'อื่นๆ (Other)',
];

export default function StaffReportForm({ editingReport = null, onSuccess = null }) {
  const { user, userProfile } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [projectList, setProjectList] = useState(DEFAULT_PROJECTS);
  const [departmentList, setDepartmentList] = useState(DEPARTMENTS);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState('');

  const [taskList, setTaskList] = useState([
    {
      id: 'task-1',
      project: DEFAULT_PROJECTS[0],
      startTime: '08:30',
      endTime: '12:00',
      hours: 3.5,
      taskDetail: '',
      progress: 'เสร็จสิ้น (100%)',
    },
    {
      id: 'task-2',
      project: DEFAULT_PROJECTS[0],
      startTime: '13:00',
      endTime: '17:30',
      hours: 4.5,
      taskDetail: '',
      progress: 'กำลังดำเนินการ (50%)',
    },
  ]);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    department: '',
    position: '',
    reportDate: today,
    workType: 'Onsite',
    startTime: '08:30',
    endTime: '17:30',
    breakMinutes: 60,
    leaveType: LEAVE_TYPES[0],
    leaveDuration: 'full',
    leaveReason: '',
    issuesFaced: '',
    nextDayPlan: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastSubmittedId, setLastSubmittedId] = useState(null);

  const [prevEditingReport, setPrevEditingReport] = useState(editingReport);

  // ปรับปรุง Form State เมื่อ editingReport เปลี่ยน (ตามแนวทาง React: Adjusting state during render)
  if (editingReport !== prevEditingReport) {
    setPrevEditingReport(editingReport);
    if (editingReport) {
      setFormData({
        employeeId: editingReport.employeeId || '',
        employeeName: editingReport.employeeName || editingReport.userName || '',
        department: editingReport.department || DEPARTMENTS[0],
        position: editingReport.position || '',
        reportDate: editingReport.reportDate || editingReport.date || today,
        workType: editingReport.workType || 'Onsite',
        startTime: editingReport.startTime || '08:30',
        endTime: editingReport.endTime || '17:30',
        breakMinutes: editingReport.breakMinutes || 60,
        leaveType: editingReport.leaveInfo?.leaveType || LEAVE_TYPES[0],
        leaveDuration: editingReport.leaveInfo?.leaveDuration || 'full',
        leaveReason: editingReport.leaveInfo?.leaveReason || '',
        issuesFaced: editingReport.issuesFaced || '',
        nextDayPlan: editingReport.nextDayPlan || '',
      });

      if (editingReport.tasks && editingReport.tasks.length > 0) {
        setTaskList(editingReport.tasks);
      }
    }
  }

  const effectiveEmployeeId = formData.employeeId || userProfile?.employeeId || '';
  const effectiveEmployeeName = formData.employeeName || userProfile?.name || user?.displayName || '';
  const effectiveDepartment = formData.department || userProfile?.department || DEPARTMENTS[0];
  const effectivePosition = formData.position || userProfile?.position || '';

  const calculatedTotalHours = useMemo(() => {
    if (formData.workType === 'Leave') {
      const dur = LEAVE_DURATIONS.find((d) => d.id === formData.leaveDuration);
      return dur ? dur.hours : 8;
    }

    if (formData.startTime && formData.endTime) {
      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [endH, endM] = formData.endTime.split(':').map(Number);
      let diffMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (diffMinutes > 240) {
        diffMinutes -= Number(formData.breakMinutes) || 0;
      }
      return Math.max(0, Number((diffMinutes / 60).toFixed(1)));
    }
    return 8;
  }, [formData.startTime, formData.endTime, formData.breakMinutes, formData.workType, formData.leaveDuration]);

  // โหลดรายชื่อโครงการและแผนกจาก Firestore เมื่อเริ่มต้น
  useEffect(() => {
    let isMounted = true;

    const fetchMasterData = async () => {
      if (isFirebaseConfigured()) {
        try {
          const [snapshot, deptSnap] = await Promise.all([
            getDocs(collection(db, 'projects')),
            getDocs(collection(db, 'departments')),
          ]);

          if (!snapshot.empty && isMounted) {
            const fetched = [];
            snapshot.forEach((docSnap) => {
              if (docSnap.data().name) fetched.push(docSnap.data().name);
            });
            if (fetched.length > 0) {
              setProjectList(Array.from(new Set([...DEFAULT_PROJECTS, ...fetched])));
            }
          }

          if (!deptSnap.empty && isMounted) {
            const fetchedDept = [];
            deptSnap.forEach((docSnap) => {
              if (docSnap.data().name) fetchedDept.push(docSnap.data().name);
            });
            if (fetchedDept.length > 0) {
              setDepartmentList(Array.from(new Set([...DEPARTMENTS, ...fetchedDept])));
            }
          }
        } catch (e) {
          console.log('Using default project/department list fallback', e);
        }
      }
    };

    void fetchMasterData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewProject = (e) => {
    e.preventDefault();
    const trimmed = newProjectInput.trim();
    if (!trimmed) return;

    void (async () => {
      if (!projectList.includes(trimmed)) {
        setProjectList((prev) => [trimmed, ...prev]);

        if (isFirebaseConfigured()) {
          try {
            await addDoc(collection(db, 'projects'), {
              name: trimmed,
              createdAt: serverTimestamp(),
              createdBy: user?.uid || effectiveEmployeeId || 'staff',
            });
          } catch (err) {
            console.error('Could not save project to firestore:', err);
          }
        }
      }

      if (taskList.length > 0) {
        updateTask(0, 'project', trimmed);
      }
      setNewProjectInput('');
      setShowAddProjectModal(false);
    })();
  };

  const addTask = () => {
    setTaskList((prev) => [
      ...prev,
      {
        id: 'task-' + Date.now(),
        project: projectList[0] || 'ทั่วไป',
        startTime: '13:00',
        endTime: '17:30',
        hours: 4.5,
        taskDetail: '',
        progress: 'กำลังดำเนินการ (50%)',
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

      if (field === 'startTime' || field === 'endTime') {
        const s = field === 'startTime' ? value : next[index].startTime;
        const e = field === 'endTime' ? value : next[index].endTime;
        if (s && e) {
          const [sh, sm] = s.split(':').map(Number);
          const [eh, em] = e.split(':').map(Number);
          const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
          next[index].hours = Math.max(0, Number(diff.toFixed(1)));
        }
      }
      return next;
    });
  };

  // Helper Function สำหรับสกัดข้อความผลรวมงาน/วันลาเพื่อแก้เตือน S3358 (Nested Ternary)
  const getCombinedTaskDetails = useCallback(() => {
    if (formData.workType === 'Leave') {
      const durationText = formData.leaveDuration === 'full' ? 'เต็มวัน' : 'ครึ่งวัน';
      const reasonText = formData.leaveReason || 'ไม่ได้ระบุ';
      return `[ลางาน: ${formData.leaveType}] ระยะเวลา: ${durationText}\nเหตุผล: ${reasonText}`;
    }

    return taskList
      .map((t, i) => `${i + 1}. [${t.project}] (${t.startTime}-${t.endTime}, ${t.hours} ชม.) - ความคืบหน้า ${t.progress}\n   ${t.taskDetail}`)
      .join('\n\n');
  }, [formData.workType, formData.leaveType, formData.leaveDuration, formData.leaveReason, taskList]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    if (!effectiveEmployeeId.trim() || !effectiveEmployeeName.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาระบุรหัสพนักงาน และชื่อ-นามสกุล',
      });
      setLoading(false);
      return;
    }

    if (formData.workType !== 'Leave') {
      const hasEmptyTask = taskList.some((t) => !t.taskDetail.trim());
      if (hasEmptyTask) {
        setStatusMessage({
          type: 'error',
          text: 'กรุณากรอกรายละเอียดงานในทุกรายการให้ครบถ้วนก่อนบันทึก',
        });
        setLoading(false);
        return;
      }
    }

    const combinedTaskDetails = getCombinedTaskDetails();
    const primaryProject =
      formData.workType === 'Leave'
        ? 'การลางาน'
        : Array.from(new Set(taskList.map((t) => t.project))).join(', ');

    const payload = {
      userId: user?.uid || '',
      employeeId: effectiveEmployeeId.trim(),
      employeeName: effectiveEmployeeName.trim(),
      userName: effectiveEmployeeName.trim(),
      department: effectiveDepartment,
      position: effectivePosition.trim(),
      reportDate: formData.reportDate,
      date: formData.reportDate,
      workType: formData.workType,
      hoursWorked: Number(calculatedTotalHours) || 8,
      workTimeRange: `${formData.startTime} - ${formData.endTime}`,
      startTime: formData.startTime,
      endTime: formData.endTime,
      leaveInfo:
        formData.workType === 'Leave'
          ? {
            leaveType: formData.leaveType,
            leaveDuration: formData.leaveDuration,
            leaveReason: formData.leaveReason,
          }
          : null,
      tasks: formData.workType === 'Leave' ? [] : taskList,
      projectTitle: primaryProject,
      projectName: primaryProject,
      taskDetails: combinedTaskDetails,
      description: combinedTaskDetails,
      issuesFaced: formData.issuesFaced,
      nextDayPlan: formData.nextDayPlan,
      status: 'pending',
      updatedAt: serverTimestamp(),
    };

    void (async () => {
      try {
        if (isFirebaseConfigured()) {
          if (editingReport?.id) {
            await updateDoc(doc(db, 'reports', editingReport.id), payload);
            setLastSubmittedId(editingReport.id);
            setStatusMessage({
              type: 'success',
              text: `อัปเดตการแก้ไขรายงานประจำวันสำเร็จ! รหัสเอกสาร: ${editingReport.id}`,
            });
          } else {
            payload.createdAt = serverTimestamp();
            const docRef = await addDoc(collection(db, 'reports'), payload);
            setLastSubmittedId(docRef.id);
            setStatusMessage({
              type: 'success',
              text: `บันทึกรายงานประจำวันสำเร็จ! รหัสเอกสาร: ${docRef.id}`,
            });
          }
        }

        if (onSuccess) {
          onSuccess();
        }

        if (!editingReport) {
          setTaskList([
            {
              id: 'task-1',
              project: projectList[0] || 'ทั่วไป',
              startTime: '08:30',
              endTime: '12:00',
              hours: 3.5,
              taskDetail: '',
              progress: 'เสร็จสิ้น (100%)',
            },
          ]);
          setFormData((prev) => ({
            ...prev,
            issuesFaced: '',
            nextDayPlan: '',
            leaveReason: '',
          }));
        }
      } catch (error) {
        console.error('Firestore Error:', error);
        setStatusMessage({
          type: 'error',
          text: `เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  const renderSubmitButtonContent = () => {
    if (loading) {
      return (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>กำลังบันทึกข้อมูล...</span>
        </>
      );
    }

    if (editingReport) {
      return (
        <>
          <Save className="w-4 h-4" />
          <span>อัปเดตการแก้ไขรายงาน</span>
        </>
      );
    }

    if (formData.workType === 'Leave') {
      return (
        <>
          <Send className="w-4 h-4" />
          <span>บันทึกการลางาน</span>
        </>
      );
    }

    return (
      <>
        <Send className="w-4 h-4" />
        <span>บันทึกรายงาน ({taskList.length} รายการ)</span>
      </>
    );
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
                {editingReport ? 'แก้ไขแบบบันทึกรายงานการปฏิบัติงาน' : 'แบบบันทึกรายงานการปฏิบัติงานประจำวัน'}
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
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 text-sm ${statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
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
        {/* Section 1: ข้อมูลผู้ปฏิบัติงาน */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900 text-base">
                1. ข้อมูลผู้ปฏิบัติงาน
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="employeeId" className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสพนักงาน (Employee ID) <span className="text-rose-500">*</span>
              </label>
              <input
                id="employeeId"
                type="text"
                name="employeeId"
                value={effectiveEmployeeId}
                onChange={handleChange}
                placeholder="เช่น EMP-1042"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50/50 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label htmlFor="employeeName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อ - นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                id="employeeName"
                type="text"
                name="employeeName"
                value={effectiveEmployeeName}
                onChange={handleChange}
                placeholder="เช่น นายพงศกร ประเสริฐสุข"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50/50 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-xs font-semibold text-slate-700 mb-1.5">
                สังกัดฝ่าย / แผนก <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  id="department"
                  name="department"
                  value={effectiveDepartment}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900"
                >
                  {departmentList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ตำแหน่งงาน (Position)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="position"
                  type="text"
                  name="position"
                  value={effectivePosition}
                  onChange={handleChange}
                  placeholder="เช่น Software Engineer, System Analyst"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: วันที่และรูปแบบการทำงาน */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-base">
              2. วันที่และรูปแบบการปฏิบัติงาน
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reportDate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                วันที่รายงาน (Report Date) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="reportDate"
                  type="date"
                  name="reportDate"
                  value={formData.reportDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900"
                />
              </div>
            </div>

            {formData.workType !== 'Leave' ? (
              <div>
                <label htmlFor="startTime" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ช่วงเวลาทำงานประจำวัน (Work Time Range)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">เริ่ม:</span>
                    <input
                      id="startTime"
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
                      id="endTime"
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
                <label htmlFor="leaveDuration" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ระยะเวลาการลา <span className="text-rose-500">*</span>
                </label>
                <select
                  id="leaveDuration"
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

          {/* ปุ่มเลือก Work Type */}
          <div>
            <label htmlFor="workType" className="block text-xs font-semibold text-slate-700 mb-2">
              รูปแบบการปฏิบัติงาน / สถานะ <span className="text-rose-500">*</span>
            </label>
            <div id="workType" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {WORK_TYPES.map((type) => {
                const isSelected = formData.workType === type.id;
                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => setFormData((prev) => ({ ...prev, workType: type.id }))}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center text-center gap-1 ${isSelected
                        ? `${type.color} ring-2 ring-blue-500/30 shadow-xs`
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* รายละเอียดกรณีเลือก ลางาน */}
          {formData.workType === 'Leave' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <Palmtree className="w-4 h-4 text-rose-600" />
                <span>บันทึกข้อมูลการลางาน (Leave Details)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="leaveType" className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทการลา <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="leaveType"
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
                  <label htmlFor="leaveReason" className="block text-xs font-semibold text-slate-700 mb-1">
                    เหตุผลการลา / หมายเหตุเพิ่มเติม
                  </label>
                  <input
                    id="leaveReason"
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

        {/* Section 3: รายละเอียดงานที่ปฏิบัติ */}
        {formData.workType !== 'Leave' && (
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-medium"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มโครงการใหม่</span>
                </button>

                <button
                  type="button"
                  onClick={addTask}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
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
                  className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3"
                >
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

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label htmlFor={`task-project-${task.id}`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                        โครงการ / กิจกรรม <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id={`task-project-${task.id}`}
                        value={task.project}
                        onChange={(e) => updateTask(index, 'project', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 font-medium"
                      >
                        {projectList.map((proj) => (
                          <option key={proj} value={proj}>
                            📁 {proj}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor={`task-start-time-${task.id}`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ช่วงเวลาทำงาน
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          id={`task-start-time-${task.id}`}
                          type="time"
                          value={task.startTime}
                          onChange={(e) => updateTask(index, 'startTime', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white text-slate-900"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="time"
                          value={task.endTime}
                          onChange={(e) => updateTask(index, 'endTime', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-[11px] bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor={`task-progress-${task.id}`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ความคืบหน้า
                      </label>
                      <select
                        id={`task-progress-${task.id}`}
                        value={task.progress}
                        onChange={(e) => updateTask(index, 'progress', e.target.value)}
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

                  <div>
                    <label htmlFor={`task-detail-${task.id}`} className="block text-[11px] font-semibold text-slate-600 mb-1">
                      รายละเอียดงานที่ปฏิบัติ <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id={`task-detail-${task.id}`}
                      rows={2}
                      value={task.taskDetail}
                      onChange={(e) => updateTask(index, 'taskDetail', e.target.value)}
                      placeholder="ระบุผลการทำงาน เช่น ตรวจสอบระบบเครือข่ายและอัปเดต Firmware สวิตช์หลัก"
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: ปัญหาและอุปสรรค */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-base">
              4. ปัญหาและอุปสรรค / แผนงานวันถัดไป
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="issuesFaced" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ปัญหาหรืออุปสรรคที่พบ (Issues Faced)
              </label>
              <textarea
                id="issuesFaced"
                name="issuesFaced"
                rows={3}
                value={formData.issuesFaced}
                onChange={handleChange}
                placeholder="ระบุปัญหาที่เกิดขึ้น หรือใส่ 'ไม่มีปัญหา' หากดำเนินงานได้ราบรื่น"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="nextDayPlan" className="block text-xs font-semibold text-slate-700 mb-1.5">
                แผนงานวันถัดไป (Next Day Plan)
              </label>
              <textarea
                id="nextDayPlan"
                name="nextDayPlan"
                rows={3}
                value={formData.nextDayPlan}
                onChange={handleChange}
                placeholder="ระบุสิ่งที่จะทำในวันถัดไป หรือสิ่งที่ต้องติดตามต่อ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {renderSubmitButtonContent()}
          </button>
        </div>
      </form>

      {/* Modal เพิ่มโครงการใหม่ */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
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
                <label htmlFor="newProjectInput" className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อโครงการ / กิจกรรม <span className="text-rose-500">*</span>
                </label>
                <input
                  id="newProjectInput"
                  type="text"
                  value={newProjectInput}
                  onChange={(e) => setNewProjectInput(e.target.value)}
                  placeholder="เช่น โครงการพัฒนา AI Assistant T-NET"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
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