// src/app/supervisor/dashboard/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
  Palmtree,
  Shield,
  Layers,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { DEPARTMENTS } from '@/components/StaffReportForm';

// ข้อมูลตัวอย่างรายงานสำหรับโหมด Demo หรือเริ่มต้น
const DEMO_REPORTS_SEED = [
  {
    id: 'rep-demo-1',
    employeeId: 'EMP-1001',
    employeeName: 'สมชาย ใจมั่นคง',
    userName: 'สมชาย ใจมั่นคง',
    department: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)',
    position: 'Senior Fullstack Engineer',
    projectTitle: 'ระบบ Staff Work Report',
    date: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    workType: 'Onsite',
    hoursWorked: 8,
    status: 'pending',
    description: 'พัฒนาระบบ Dashboard และ Auth Profile สำหรับระบบรายงานงานประจำวัน',
  },
  {
    id: 'rep-demo-2',
    employeeId: 'EMP-1002',
    employeeName: 'อนันต์ ทรงคุณ',
    userName: 'อนันต์ ทรงคุณ',
    department: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)',
    position: 'Frontend Developer',
    projectTitle: 'ระบบ Staff Work Report',
    date: new Date().toISOString().split('T')[0],
    reportDate: new Date().toISOString().split('T')[0],
    workType: 'WFH',
    hoursWorked: 7.5,
    status: 'approved',
    description: 'ปรับปรุง UI components และแก้ไขปัญหา Responsive ในหน้าบันทึกรายงาน',
  },
  {
    id: 'rep-demo-3',
    employeeId: 'EMP-1003',
    employeeName: 'วิภาดา วรรณศิลป์',
    userName: 'วิภาดา วรรณศิลป์',
    department: 'ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)',
    position: 'Cloud & DevOps Engineer',
    projectTitle: 'Cloud Migration Phase 2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reportDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    workType: 'Onsite',
    hoursWorked: 8,
    status: 'approved',
    description: 'ทดสอบ Deploy คลัสเตอร์ Kubernetes บน Google Cloud Platform',
  },
  {
    id: 'rep-demo-4',
    employeeId: 'EMP-1004',
    employeeName: 'เกรียงศักดิ์ ภูริทัต',
    userName: 'เกรียงศักดิ์ ภูริทัต',
    department: 'ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)',
    position: 'Cybersecurity Analyst',
    projectTitle: 'Security Audit ลูกค้าธนาคาร',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reportDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    workType: 'Client Site',
    hoursWorked: 8,
    status: 'pending',
    description: 'เข้าตรวจประเมินความปลอดภัยระบบ Web Application Firewall ของลูกค้า',
  },
  {
    id: 'rep-demo-5',
    employeeId: 'EMP-1005',
    employeeName: 'สุดารัตน์ พงษ์เพ็ญ',
    userName: 'สุดารัตน์ พงษ์เพ็ญ',
    department: 'ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)',
    position: 'HR Specialist',
    projectTitle: 'ระบบบริหารจัดการทรัพยากรบุคคล (HRMS)',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    reportDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    workType: 'Leave',
    hoursWorked: 8,
    status: 'approved',
    description: 'ลากิจส่วนตัว (Personal Leave)',
  },
  {
    id: 'rep-demo-6',
    employeeId: 'EMP-1006',
    employeeName: 'ฐิติกร นิธิโรจน์',
    userName: 'ฐิติกร นิธิโรจน์',
    department: 'ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)',
    position: 'System Support Specialist',
    projectTitle: 'งานบริการลูกค้า & Support (MA)',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    reportDate: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    workType: 'Onsite',
    hoursWorked: 8,
    status: 'rejected',
    description: 'แก้ไข Ticket ปัญหาการเข้าใช้งานระบบของลูกค้าสัญญา MA',
    supervisorComment: 'กรุณาระบุเลขที่ Ticket และรายละเอียดการแก้ไขให้ชัดเจนยิ่งขึ้น',
  },
];

// Helper สรุปสัดส่วนรูปแบบการทำงาน
const WORK_TYPE_COLORS = {
  Onsite: { label: '🏢 Onsite (เข้าสำนักงาน)', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  WFH: { label: '🏠 Work from Home', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Client Site': { label: '🚗 ไซต์งานลูกค้า', bg: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200' },
  Hybrid: { label: '🔄 Hybrid / อื่นๆ', bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  Leave: { label: '🏖️ ลางาน (Leave)', bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function SupervisorDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();

  const userRole = user?.role || userProfile?.role || 'staff';
  const hasAccess = userRole === 'admin' || userRole === 'supervisor';

  const [reports, setReports] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Filters
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | '7days' | 'month'
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // ดึงข้อมูลรายงานจาก Firestore
  const fetchAllReports = useCallback(async () => {
    setDataLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const querySnapshot = await getDocs(collection(db, 'reports'));
        const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        list.sort((a, b) => {
          const dateA = a.date || a.reportDate || '';
          const dateB = b.date || b.reportDate || '';
          return dateB.localeCompare(dateA);
        });

        setReports(list.length > 0 ? list : DEMO_REPORTS_SEED);
      } else {
        setReports(DEMO_REPORTS_SEED);
      }
    } catch (err) {
      console.error('Error fetching dashboard reports:', err);
      setReports(DEMO_REPORTS_SEED);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      if (!hasAccess) return;
      await fetchAllReports();
    };

    if (isMounted) {
      void loadInitial();
    }

    return () => {
      isMounted = false;
    };
  }, [hasAccess, fetchAllReports]);

  // คำนวณวันที่อ้างอิงผ่าน useState เพื่อให้ useMemo เป็น Idempotent ตามมาตรฐาน React 19
  const [referenceDates] = useState(() => {
    const now = Date.now();
    return {
      todayStr: new Date(now).toISOString().split('T')[0],
      sevenDaysAgo: new Date(now - 7 * 86400000).toISOString().split('T')[0],
      currentMonthPrefix: new Date(now).toISOString().substring(0, 7),
    };
  });

  // กรองข้อมูลรายงานตาม Filter
  const filteredReports = useMemo(() => {
    const { todayStr, sevenDaysAgo, currentMonthPrefix } = referenceDates;

    return reports.filter((item) => {
      const itemDate = item.date || item.reportDate || '';

      // กรองตามเวลา
      if (timeFilter === 'today' && itemDate !== todayStr) return false;
      if (timeFilter === '7days' && itemDate < sevenDaysAgo) return false;
      if (timeFilter === 'month' && !itemDate.startsWith(currentMonthPrefix)) return false;

      // กรองตามแผนก
      if (departmentFilter !== 'all' && item.department !== departmentFilter) return false;

      return true;
    });
  }, [reports, timeFilter, departmentFilter, referenceDates]);

  // คำนวณ KPIs ภาพรวม
  const stats = useMemo(() => {
    const total = filteredReports.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let totalHours = 0;
    let leaveCount = 0;
    const staffSet = new Set();
    const workTypeCounts = { Onsite: 0, WFH: 0, 'Client Site': 0, Hybrid: 0, Leave: 0 };
    const deptWorkload = {};
    const projectHours = {};

    filteredReports.forEach((r) => {
      const st = r.status || 'pending';
      if (st === 'approved') approved += 1;
      else if (st === 'rejected') rejected += 1;
      else pending += 1;

      const hours = Number(r.hoursWorked) || (r.workType === 'Leave' ? 8 : 8);
      totalHours += hours;

      if (r.employeeName || r.userName) staffSet.add(r.employeeName || r.userName);
      else if (r.employeeId) staffSet.add(r.employeeId);

      const wt = r.workType || 'Onsite';
      if (workTypeCounts[wt] !== undefined) {
        workTypeCounts[wt] += 1;
      } else {
        workTypeCounts.Onsite += 1;
      }

      if (wt === 'Leave') leaveCount += 1;

      const dept = r.department || 'ไม่ระบุแผนก';
      deptWorkload[dept] = (deptWorkload[dept] || 0) + 1;

      const prj = r.projectName || r.projectTitle || 'งานทั่วไป';
      projectHours[prj] = (projectHours[prj] || 0) + hours;
    });

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      totalHours: Number(totalHours.toFixed(1)),
      staffCount: staffSet.size,
      leaveCount,
      approvalRate,
      workTypeCounts,
      deptWorkload,
      projectHours,
    };
  }, [filteredReports]);

  // รายการรออนุมัติล่าสุด (Pending Reports)
  const pendingReports = useMemo(() => {
    return filteredReports.filter((r) => (r.status || 'pending') === 'pending').slice(0, 6);
  }, [filteredReports]);

  // ตรวจสอบสถานะการยืนยันตัวตน
  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดแดชบอร์ด...</p>
        </div>
      </div>
    );
  }

  // กรณีผู้ใช้ยังไม่ได้ล็อกอิน
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            คุณต้องเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin) หรือหัวหน้างาน (Supervisor) เพื่อเข้าถึงแดชบอร์ดนี้
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              ไปที่หน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // กรณีไม่มีสิทธิ์ (Staff)
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">พื้นที่สำหรับผู้ดูแลระบบและหัวหน้างานเท่านั้น</h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            คุณเข้าสู่ระบบด้วยสิทธิ์ <strong className="text-gray-800">{userRole}</strong>{' '}
            ซึ่งไม่มีสิทธิ์เข้าถึงแดชบอร์ดภาพรวมนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
            (Admin / Supervisor)
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Tab Switcher: แดชบอร์ด VS ตรวจสอบ/อนุมัติงาน */}
      <div className="flex border-b border-slate-200 pb-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/supervisor/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white shadow-xs transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>แดชบอร์ดภาพรวม (Dashboard)</span>
          </Link>
          <Link
            href="/supervisor"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ตรวจสอบและอนุมัติงาน (Review Reports)</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={fetchAllReports}
          disabled={dataLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold border border-white/15">
            <TrendingUp className="w-3.5 h-3.5 text-blue-300" />
            <span>Supervisor Executive Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            แดชบอร์ดภาพรวมการปฏิบัติงาน
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl">
            ติดตามสถานะรายงานการปฏิบัติงานรายวัน ตรวจสอบสถิติชั่วโมงงาน สัดส่วนการทำงาน และอนุมัติรายงานทีมงาน T-NET
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5">
          <Link
            href="/supervisor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            <span>ไปที่หน้าอนุมัติรายงาน ({stats.pending})</span>
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-xs transition-all"
          >
            <Calendar className="w-4 h-4 text-blue-200" />
            <span>ปฏิทินงาน</span>
          </Link>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>ตัวกรองแดชบอร์ด:</span>
          </div>

          {/* Time period filter */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'today' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === '7days' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เดือนนี้
            </button>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-hidden"
          >
            <option value="all">ทุกแผนก / ฝ่าย</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          แสดงข้อมูล: <strong className="text-slate-800">{filteredReports.length}</strong> รายการ
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Reports */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>รายงานทั้งหมด</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400">ฉบับสะสมในระบบ</div>
        </div>

        {/* Pending Approval */}
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>รอตรวจสอบ</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
          <div className="text-[11px] text-amber-700/80">รอการตรวจสอบ</div>
        </div>

        {/* Approved */}
        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>อนุมัติแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{stats.approved}</div>
          <div className="text-[11px] text-emerald-700/80">
            อนุมัติ {stats.approvalRate}%
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>ส่งกลับแก้ไข</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900">{stats.rejected}</div>
          <div className="text-[11px] text-rose-700/80">ไม่อนุมัติ / ให้แก้ไข</div>
        </div>

        {/* Total Work Hours */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>ชั่วโมงงานรวม</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-950">{stats.totalHours}</div>
          <div className="text-[11px] text-slate-400">ชั่วโมงสะสม</div>
        </div>

        {/* Active Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>พนักงานที่ส่งงาน</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-950">{stats.staffCount}</div>
          <div className="text-[11px] text-slate-400">คน (ลางาน {stats.leaveCount} คน)</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Type Distribution Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>สัดส่วนรูปแบบการปฏิบัติงาน (Work Type Distribution)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                จำแนกตาม Onsite, WFH, ไซต์งานลูกค้า และการลา
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              รวม {stats.total} รายงาน
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {Object.entries(WORK_TYPE_COLORS).map(([key, info]) => {
              const count = stats.workTypeCounts[key] || 0;
              const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">{info.label}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ฉบับ ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${info.bg} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Workload Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>ปริมาณรายงานแยกตามแผนก (Department Reports)</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                สัดส่วนการส่งรายงานและภาระงานของแต่ละฝ่าย
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 max-h-[280px] overflow-y-auto pr-1">
            {Object.keys(stats.deptWorkload).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีข้อมูลรายงานของแผนกที่เลือก
              </div>
            ) : (
              Object.entries(stats.deptWorkload)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span className="truncate max-w-[260px] font-semibold text-slate-800" title={dept}>
                          {dept}
                        </span>
                        <span className="text-slate-500 font-mono">{count} รายงาน ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Top Projects Workload */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>ชั่วโมงการปฏิบัติงานตามโครงการ (Project Workload Allocation)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              โครงการที่ทีมงานใช้เวลาปฏิบัติงานมากที่สุด
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {Object.entries(stats.projectHours)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([project, hours], idx) => (
              <div
                key={project}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    อันดับ #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-purple-700 font-mono">{hours} ชม.</span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate" title={project}>
                  {project}
                </div>
                <div className="text-[11px] text-slate-500">
                  สัดส่วน:{' '}
                  {stats.totalHours > 0
                    ? Math.round((hours / stats.totalHours) * 100)
                    : 0}
                  % ของชั่วโมงทั้งหมด
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Pending Reports Quick Action Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>รายงานรอดำเนินการตรวจสอบล่าสุด (Pending Approval Queue)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              รายงานที่ส่งเข้ามาและยังรอการตรวจสอบจากหัวหน้างาน
            </p>
          </div>

          <Link
            href="/supervisor"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>ดูและอนุมัติรายงานทั้งหมด</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">พนักงาน</th>
                <th className="py-3 px-4">แผนก</th>
                <th className="py-3 px-4">โครงการ / งาน</th>
                <th className="py-3 px-4">รูปแบบงาน</th>
                <th className="py-3 px-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    🎉 ไม่มีรายงานที่รอตรวจสอบในเงื่อนไขที่เลือก ทุกรายงานได้รับการตรวจสอบครบถ้วนแล้ว
                  </td>
                </tr>
              ) : (
                pendingReports.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                      {item.date || item.reportDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {item.employeeName || item.userName || 'ไม่ระบุชื่อ'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.employeeId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={item.department}>
                      {item.department || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-blue-700 truncate max-w-[220px]">
                        {item.projectName || item.projectTitle || 'งานทั่วไป'}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[220px]">
                        {item.description || item.taskDetails || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          WORK_TYPE_COLORS[item.workType]?.light || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.workType || 'Onsite'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Link
                        href="/supervisor"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                      >
                        <span>ตรวจรายงาน</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
