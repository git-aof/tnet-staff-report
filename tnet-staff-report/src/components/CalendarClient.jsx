// src/components/CalendarClient.jsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import thLocale from '@fullcalendar/react/locales/th';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import { db, isFirebaseConfigured } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
    Calendar as CalendarIcon,
    Filter,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    XCircle,
    FileText,
    X,
    RotateCcw,
    Briefcase,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';

// Helper function กำหนดสีตามสถานะ (หลีกเลี่ยง Nested Ternary ตาม Sonar S3358)
const getEventBgColor = (status) => {
    switch (status) {
        case 'approved':
            return '#10B981'; // เขียว - อนุมัติแล้ว
        case 'rejected':
            return '#EF4444'; // แดง - ไม่อนุมัติ/แก้ไข
        case 'pending':
        default:
            return '#F59E0B'; // ส้ม - รอตรวจสอบ
    }
};

const getEventBorderColor = (status) => {
    switch (status) {
        case 'approved':
            return '#059669';
        case 'rejected':
            return '#DC2626';
        case 'pending':
        default:
            return '#D97706';
    }
};

const getStatusBadgeConfig = (status) => {
    switch (status) {
        case 'approved':
            return {
                text: 'อนุมัติแล้ว',
                className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                icon: CheckCircle2,
            };
        case 'rejected':
            return {
                text: 'ไม่อนุมัติ / ให้แก้ไข',
                className: 'bg-rose-50 text-rose-700 border-rose-200',
                icon: XCircle,
            };
        case 'pending':
        default:
            return {
                text: 'รอการตรวจสอบ',
                className: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: AlertCircle,
            };
    }
};

function StatusBadge({ status }) {
    const badge = getStatusBadgeConfig(status);
    const BadgeIcon = badge.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{badge.text}</span>
        </span>
    );
}

function getWorkTimeDisplay(report) {
    if (report.workTimeRange) return report.workTimeRange;
    if (report.startTime && report.endTime) return `${report.startTime} - ${report.endTime}`;
    return '-';
}

export default function CalendarClient() {
    const { user, userProfile, loading: authLoading } = useAuth();

    // Data states
    const [rawReports, setRawReports] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Filter states
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    // Modal state สำหรับดูรายละเอียดงานเมื่อคลิก Event
    const [selectedReport, setSelectedReport] = useState(null);

    // ตรวจสอบสิทธิ์ผู้ใช้งาน (RBAC)
    const userRole = user?.role || userProfile?.role || 'staff';
    const isSupervisorOrAdmin = userRole === 'supervisor' || userRole === 'admin';

    // ดึงข้อมูลครั้งเดียวเมื่อ Component Mount หรือสิทธิ์เปลี่ยน
    useEffect(() => {
        if (authLoading || !user) return;

        let isMounted = true;

        const loadReports = async () => {
            try {
                if (!isFirebaseConfigured()) {
                    if (isMounted) setIsFetching(false);
                    return;
                }

                const reportsRef = collection(db, 'reports');
                let reportsQuery;

                if (isSupervisorOrAdmin) {
                    reportsQuery = query(reportsRef);
                } else {
                    const currentEmpId = user.employeeId || userProfile?.employeeId;
                    const currentUid = user.uid;

                    if (currentEmpId) {
                        reportsQuery = query(reportsRef, where('employeeId', '==', currentEmpId));
                    } else if (currentUid) {
                        reportsQuery = query(reportsRef, where('userId', '==', currentUid));
                    } else {
                        reportsQuery = query(reportsRef);
                    }
                }

                const snapshot = await getDocs(reportsQuery);

                if (isMounted) {
                    const data = snapshot.docs.map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                    }));
                    setRawReports(data);
                    setIsFetching(false);
                }
            } catch (err) {
                console.error('Error fetching reports for calendar:', err);
                if (isMounted) {
                    setFetchError('ไม่สามารถโหลดข้อมูลรายงานได้ กรุณาลองใหม่อีกครั้ง');
                    setIsFetching(false);
                }
            }
        };

        void loadReports();

        return () => {
            isMounted = false;
        };
    }, [user, userProfile, isSupervisorOrAdmin, authLoading]);

    // สกัดรายการโครงการและพนักงานที่ไม่ซ้ำกันจาก Raw Data
    const { projectOptions, staffOptions } = useMemo(() => {
        const projSet = new Set();
        const staffMap = new Map();

        rawReports.forEach((item) => {
            if (item.projectName) projSet.add(item.projectName);
            if (item.projectTitle) projSet.add(item.projectTitle);
            if (Array.isArray(item.tasks)) {
                item.tasks.forEach((t) => {
                    if (t.project) projSet.add(t.project);
                });
            }

            const staffId = item.userId || item.employeeId || item.userName;
            const staffName = item.employeeName || item.userName;
            if (staffId && staffName && !staffMap.has(staffId)) {
                staffMap.set(staffId, {
                    id: staffId,
                    name: staffName,
                    employeeId: item.employeeId || '',
                });
            }
        });

        return {
            projectOptions: Array.from(projSet).filter(Boolean).sort((a, b) => a.localeCompare(b)),
            staffOptions: Array.from(staffMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
        };
    }, [rawReports]);

    // กรองรายงานในหน่วยความจำ
    const filteredReports = useMemo(() => {
        return rawReports.filter((item) => {
            const matchProject =
                selectedProject === 'all' ||
                item.projectName === selectedProject ||
                item.projectTitle === selectedProject ||
                (Array.isArray(item.tasks) && item.tasks.some((t) => t.project === selectedProject));

            const matchStaff =
                selectedStaff === 'all' ||
                item.userId === selectedStaff ||
                item.employeeId === selectedStaff ||
                item.employeeName === selectedStaff ||
                item.userName === selectedStaff;

            const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;

            return matchProject && matchStaff && matchStatus;
        });
    }, [rawReports, selectedProject, selectedStaff, selectedStatus]);

    // สรุปจำนวนตัวเลขรายงานตามสถานะ
    const stats = useMemo(() => {
        let approved = 0;
        let pending = 0;
        let rejected = 0;

        filteredReports.forEach((item) => {
            if (item.status === 'approved') approved += 1;
            else if (item.status === 'rejected') rejected += 1;
            else pending += 1;
        });

        return { total: filteredReports.length, approved, pending, rejected };
    }, [filteredReports]);

    // แปลงข้อมูลให้อยู่ในโครงสร้าง FullCalendar Events
    const events = useMemo(() => {
        return filteredReports.map((item) => {
            const staffName = item.employeeName || item.userName || 'พนักงาน';
            const projName = item.projectName || item.projectTitle || '';
            const eventTitle = projName
                ? `${staffName}: ${projName}`
                : `${staffName}: ${item.description || 'ปฏิบัติงาน'}`;

            return {
                id: item.id,
                title: eventTitle,
                start: item.date || item.reportDate,
                backgroundColor: getEventBgColor(item.status),
                borderColor: getEventBorderColor(item.status),
                textColor: '#FFFFFF',
                allDay: true,
                extendedProps: {
                    report: item,
                },
            };
        });
    }, [filteredReports]);

    // จัดการ Event Click เพื่อเปิด Modal
    const handleEventClick = useCallback((clickInfo) => {
        const report = clickInfo.event.extendedProps?.report;
        if (report) {
            setSelectedReport(report);
        }
    }, []);

    // ล้างตัวกรองทั้งหมด
    const handleResetFilters = () => {
        setSelectedProject('all');
        setSelectedStaff('all');
        setSelectedStatus('all');
    };

    // กรณีอยู่ระหว่างโหลดข้อมูล Auth
    if (authLoading) {
        return (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center shadow-xs">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
            </div>
        );
    }

    // กรณีไม่ได้ล็อกอิน
    if (!user) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">จำเป็นต้องเข้าสู่ระบบ</h2>
                <p className="text-sm text-gray-600 mb-6">
                    กรุณาเข้าสู่ระบบเพื่อความปลอดภัย และเรียกดูปฏิทินบันทึกการปฏิบัติงานตามสิทธิ์ที่ได้รับ
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-xs"
                >
                    เข้าสู่ระบบ
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header แสดงระดับสิทธิ์และสถานะ */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-400" />
                        ปฏิทินบันทึกการปฏิบัติงาน
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                        {isSupervisorOrAdmin
                            ? 'ระดับสิทธิ์: หัวหน้างาน / ผู้ดูแลระบบ (เข้าถึงรายงานของพนักงานทุกคนได้)'
                            : `ระดับสิทธิ์: พนักงาน (${user.displayName || userProfile?.name || 'บันทึกงานของฉัน'})`}
                    </p>
                </div>

                {/* Counter Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>อนุมัติแล้ว: <strong>{stats.approved}</strong></span>
                    </span>
                    <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>รอตรวจสอบ: <strong>{stats.pending}</strong></span>
                    </span>
                    <span className="bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        <span>ไม่อนุมัติ: <strong>{stats.rejected}</strong></span>
                    </span>
                </div>
            </div>

            {/* Error Notification */}
            {fetchError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{fetchError}</span>
                </div>
            )}

            {/* กล่องตัวกรองข้อมูล (Filter Panel) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Filter className="w-4 h-4 text-blue-600" />
                        <span>ตัวกรองการแสดงผล</span>
                    </div>

                    {(selectedProject !== 'all' || selectedStaff !== 'all' || selectedStatus !== 'all') && (
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            ล้างตัวกรองทั้งหมด
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* กรองตามโครงการ */}
                    <div>
                        <label htmlFor="calendar-project-select" className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                            โครงการ
                        </label>
                        <select
                            id="calendar-project-select"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                        >
                            <option value="all">-- ทุกโครงการ ({projectOptions.length}) --</option>
                            {projectOptions.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* กรองตามพนักงาน */}
                    <div>
                        <label htmlFor="calendar-staff-select" className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                            พนักงาน
                        </label>
                        <select
                            id="calendar-staff-select"
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                            disabled={!isSupervisorOrAdmin}
                            className={`w-full border border-gray-300 px-3 py-2 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow ${!isSupervisorOrAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSupervisorOrAdmin ? (
                                <>
                                    <option value="all">-- พนักงานทุกคน ({staffOptions.length}) --</option>
                                    {staffOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.employeeId ? `(${s.employeeId})` : ''}
                                        </option>
                                    ))}
                                </>
                            ) : (
                                <option value="all">
                                    {user.displayName || userProfile?.name || 'รายงานของฉัน'}
                                </option>
                            )}
                        </select>
                    </div>

                    {/* กรองตามสถานะการตรวจสอบ */}
                    <div>
                        <label htmlFor="calendar-status-select" className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                            สถานะการอนุมัติ
                        </label>
                        <select
                            id="calendar-status-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                        >
                            <option value="all">-- ทุกสถานะ --</option>
                            <option value="pending">รอการตรวจสอบ (Pending)</option>
                            <option value="approved">อนุมัติแล้ว (Approved)</option>
                            <option value="rejected">ไม่อนุมัติ / ให้แก้ไข (Rejected)</option>
                        </select>
                    </div>
                </div>

                {/* สัญลักษณ์สีคำอธิบาย (Legend) */}
                <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-gray-600 border-t">
                    <span className="font-semibold text-gray-700">คำอธิบายสี:</span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-emerald-500" />
                        <span>อนุมัติแล้ว (Approved)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-amber-500" />
                        <span>รอตรวจสอบ (Pending)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-rose-500" />
                        <span>ไม่อนุมัติ / ให้แก้ไข (Rejected)</span>
                    </span>
                    <span className="text-gray-400 ml-auto">
                        สามารถคลิกที่รายการงานเพื่อดูรายละเอียดการปฏิบัติงานฉบับเต็ม
                    </span>
                </div>
            </div>

            {/* แสดง FullCalendar View */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs min-h-[500px]">
                {isFetching ? (
                    <div className="flex flex-col items-center justify-center h-96 space-y-3">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-gray-500">กำลังโหลดข้อมูลปฏิทินปฏิบัติงาน...</p>
                    </div>
                ) : (
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, classicThemePlugin]}
                        initialView="dayGridMonth"
                        locales={[thLocale]}
                        locale="th"
                        events={events}
                        eventClick={handleEventClick}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek',
                        }}
                        height="auto"
                    />
                )}
            </div>

            {/* Modal แสดงรายละเอียดรายงานการปฏิบัติงานเมื่อคลิก Event (ปรับปรุงตามมาตรฐาน HTML dialog & A11y) */}
            {selectedReport && (
                <dialog
                    open
                    aria-labelledby="modal-report-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs w-full h-full border-none"
                >
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 z-10 text-slate-800">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b pb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <StatusBadge status={selectedReport.status} />
                                    <span className="text-xs text-gray-500 font-medium">
                                        รูปแบบ: {selectedReport.workType || 'ปกติ'}
                                    </span>
                                </div>
                                <h3 id="modal-report-title" className="text-base font-bold text-gray-900">
                                    {selectedReport.projectName || selectedReport.projectTitle || 'รายงานปฏิบัติงาน'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    ประจำวันที่: {selectedReport.date || selectedReport.reportDate || '-'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ข้อมูลพนักงานและเวลาทำงาน */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                            <div>
                                <span className="text-gray-500 block">พนักงาน:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedReport.employeeName || selectedReport.userName || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">รหัสพนักงาน:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedReport.employeeId || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">แผนก:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedReport.department || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">เวลาปฏิบัติงาน:</span>
                                <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                    {getWorkTimeDisplay(selectedReport)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">ชั่วโมงการทำงาน:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedReport.hoursWorked ? `${selectedReport.hoursWorked} ชม.` : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block">ตำแหน่ง:</span>
                                <span className="font-semibold text-gray-800">
                                    {selectedReport.position || '-'}
                                </span>
                            </div>
                        </div>

                        {/* ข้อมูลการลางาน (ถ้ามี) */}
                        {selectedReport.workType === 'Leave' && selectedReport.leaveInfo && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                                <span className="font-semibold text-amber-900 block">รายละเอียดการลา:</span>
                                <p className="text-amber-800">
                                    ประเภท: {selectedReport.leaveInfo.leaveType || '-'} ({selectedReport.leaveInfo.leaveDuration || '-'})
                                </p>
                                {selectedReport.leaveInfo.leaveReason && (
                                    <p className="text-amber-800">
                                        เหตุผลการลา: {selectedReport.leaveInfo.leaveReason}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* รายการงานที่ปฏิบัติ (Tasks) */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                รายการงานที่ปฏิบัติ (Tasks)
                            </h4>
                            {Array.isArray(selectedReport.tasks) && selectedReport.tasks.length > 0 ? (
                                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                                    {selectedReport.tasks.map((task, idx) => (
                                        <div key={task.id || `task-${idx}`} className="p-3 hover:bg-gray-50/80 transition-colors">
                                            <div className="flex items-center justify-between font-semibold text-gray-800 mb-1">
                                                <span>{task.project || 'ทั่วไป'}</span>
                                                <span className="text-gray-500 font-normal">
                                                    {task.startTime && task.endTime ? `${task.startTime} - ${task.endTime}` : ''} ({task.hours || 0} ชม.)
                                                </span>
                                            </div>
                                            <p className="text-gray-600 whitespace-pre-wrap">{task.taskDetail || '-'}</p>
                                            {task.progress && (
                                                <div className="mt-1 text-right">
                                                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                                        สถานะงาน: {task.progress}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 whitespace-pre-wrap border border-gray-200">
                                    {selectedReport.taskDetails || selectedReport.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                                </div>
                            )}
                        </div>

                        {/* ปัญหาและอุปสรรค / แผนวันถัดไป */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-xl">
                                <span className="font-semibold text-rose-800 block mb-1">ปัญหาและอุปสรรค:</span>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {selectedReport.issuesFaced || '-'}
                                </p>
                            </div>
                            <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
                                <span className="font-semibold text-blue-800 block mb-1">แผนงานวันถัดไป:</span>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {selectedReport.nextDayPlan || '-'}
                                </p>
                            </div>
                        </div>

                        {/* ความคิดเห็นของหัวหน้างาน (Supervisor Feedback) */}
                        {selectedReport.supervisorComment && (
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                                <span className="font-semibold text-emerald-900 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    ความคิดเห็นจากหัวหน้างาน / ผู้ตรวจสอบ:
                                </span>
                                <p className="text-emerald-800 whitespace-pre-wrap">
                                    {selectedReport.supervisorComment}
                                </p>
                            </div>
                        )}

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-3 border-t text-xs">
                            {isSupervisorOrAdmin ? (
                                <Link
                                    href="/supervisor"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    ไปที่หน้าตรวจสอบ/อนุมัติงาน
                                </Link>
                            ) : (
                                <span className="text-gray-400">รหัสเอกสาร: {selectedReport.id}</span>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </div>
    );
}