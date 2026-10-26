// src/components/MasterDataManager.jsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { db, isFirebaseConfigured } from '@/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Building2,
  Briefcase,
  Layers,
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Shield,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Helper functions เพื่อหลีกเลี่ยง Nested Ternary ตาม Sonar S3358
const getCollectionName = (tab) => {
  switch (tab) {
    case 'departments':
      return 'departments';
    case 'positions':
      return 'positions';
    case 'projects':
      return 'projects';
    default:
      return 'users';
  }
};

const getSearchPlaceholder = (tab) => {
  switch (tab) {
    case 'departments':
      return 'ค้นหาชื่อหรือรหัสแผนก...';
    case 'positions':
      return 'ค้นหาชื่อหรือรหัสตำแหน่ง...';
    case 'projects':
      return 'ค้นหาชื่อโครงการ, รหัส หรือชื่อลูกค้า...';
    default:
      return 'ค้นหาชื่อ, อีเมล หรือรหัสพนักงาน...';
  }
};

const getProjectStatusBadge = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'on_hold':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-emerald-100 text-emerald-800';
  }
};

const getProjectStatusLabel = (status) => {
  switch (status) {
    case 'completed':
      return 'เสร็จสิ้น';
    case 'on_hold':
      return 'ระงับชั่วคราว';
    default:
      return 'กำลังดำเนินงาน';
  }
};

const getUserRoleBadge = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'supervisor':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-emerald-100 text-emerald-800';
  }
};

const getUserRoleLabel = (role) => {
  switch (role) {
    case 'admin':
      return 'Admin (ผู้ดูแลระบบ)';
    case 'supervisor':
      return 'Supervisor (หัวหน้างาน)';
    default:
      return 'Staff (พนักงาน)';
  }
};

const getModalTitle = (modalType, activeTab) => {
  const action = modalType === 'add' ? 'เพิ่ม' : 'แก้ไข';
  switch (activeTab) {
    case 'departments':
      return `${action}ข้อมูลแผนก`;
    case 'positions':
      return `${action}ข้อมูลตำแหน่ง`;
    case 'projects':
      return `${action}ข้อมูลโครงการ`;
    default:
      return `${action}ข้อมูลผู้ใช้งานและสิทธิ์`;
  }
};

const getAddButtonText = (tab) => {
  switch (tab) {
    case 'departments':
      return 'เพิ่มแผนก';
    case 'positions':
      return 'เพิ่มตำแหน่ง';
    case 'projects':
      return 'เพิ่มโครงการ';
    default:
      return 'เพิ่มผู้ใช้งาน';
  }
};

// ข้อมูลเริ่มต้นสำหรับ Seed (กรณีฐานข้อมูลยังว่างเปล่า)
const DEFAULT_DEPARTMENTS_SEED = [
  { name: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)', code: 'DEV', description: 'วิจัย พัฒนาซอฟต์แวร์ เว็บไซต์ และแอปพลิเคชัน', status: 'active' },
  { name: 'ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)', code: 'CLOUD', description: 'ดูแลจัดการโครงสร้างพื้นฐาน คลาวด์ และเครือข่ายองค์กร', status: 'active' },
  { name: 'ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)', code: 'SEC', description: 'ตรวจสอบ ประเมินความเสี่ยง และรักษาความปลอดภัยสารสนเทศ', status: 'active' },
  { name: 'ฝ่ายบริหารโครงการ (Project Management)', code: 'PMO', description: 'วางแผน ควบคุมคุณภาพ และบริหารจัดการโครงการลูกค้า', status: 'active' },
  { name: 'ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)', code: 'CS', description: 'บริการสนับสนุน MA และดูแลแก้ไขปัญหาลูกค้า', status: 'active' },
  { name: 'ฝ่ายการตลาดและพัฒนาธุรกิจ (Marketing & Sales)', code: 'MKT', description: 'พัฒนาธุรกิจ การตลาด และติดต่อลูกค้ารายใหม่', status: 'active' },
  { name: 'ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)', code: 'HR', description: 'สรรหาบุคลากร พัฒนาองค์กร และงานธุรการทั่วไป', status: 'active' },
  { name: 'ฝ่ายบัญชีและการเงิน (Accounting & Finance)', code: 'ACC', description: 'จัดทำบัญชี การเงิน ภาษี และเบิกจ่ายงบประมาณ', status: 'active' },
];

const DEFAULT_POSITIONS_SEED = [
  { name: 'Senior Fullstack Engineer', code: 'SFE', departmentName: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)', level: 'Senior / อาวุโส', status: 'active' },
  { name: 'Frontend Developer', code: 'FED', departmentName: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)', level: 'Middle / ปฏิบัติการ', status: 'active' },
  { name: 'Backend Developer', code: 'BED', departmentName: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)', level: 'Middle / ปฏิบัติการ', status: 'active' },
  { name: 'Cloud & DevOps Engineer', code: 'DEVOPS', departmentName: 'ฝ่ายระบบเครือข่ายและคลาวด์ (Cloud & Network)', level: 'Senior / อาวุโส', status: 'active' },
  { name: 'Cybersecurity Analyst', code: 'CSA', departmentName: 'ฝ่ายความมั่นคงปลอดภัยไซเบอร์ (Cybersecurity)', level: 'Senior / อาวุโส', status: 'active' },
  { name: 'Project Manager (PM)', code: 'PM', departmentName: 'ฝ่ายบริหารโครงการ (Project Management)', level: 'Manager / ผู้จัดการ', status: 'active' },
  { name: 'System Support Specialist', code: 'SUP', departmentName: 'ฝ่ายสนับสนุนลูกค้าและบริการ (Customer Support)', level: 'Middle / ปฏิบัติการ', status: 'active' },
  { name: 'HR Specialist', code: 'HRS', departmentName: 'ฝ่ายทรัพยากรบุคคลและธุรการ (HR & Admin)', level: 'Middle / ปฏิบัติการ', status: 'active' },
];

const DEFAULT_PROJECTS_SEED = [
  { name: 'ระบบ Staff Work Report', code: 'PRJ-SWR-01', client: 'T-NET Internal', status: 'active', description: 'ระบบบันทึกและติดตามผลการปฏิบัติงานรายวันของพนักงาน' },
  { name: 'Cloud Migration Phase 2', code: 'PRJ-CMP-02', client: 'ลูกค้าภาคเอกชน', status: 'active', description: 'ย้ายระบบและฐานข้อมูลขึ้นระบบคลาวด์' },
  { name: 'Security Audit ลูกค้าธนาคาร', code: 'PRJ-SEC-03', client: 'ธนาคารพาณิชย์', status: 'active', description: 'ตรวจสอบความปลอดภัยระบบงานและ Penetration Testing' },
  { name: 'ระบบบริหารจัดการทรัพยากรบุคคล (HRMS)', code: 'PRJ-HRM-04', client: 'T-NET Internal', status: 'active', description: 'พัฒนาระบบลา ข้อมูลพนักงาน และเบิกจ่ายสวัสดิการ' },
  { name: 'งานบริการลูกค้า & Support (MA)', code: 'PRJ-MA-05', client: 'ลูกค้าสัญญา MA', status: 'active', description: 'งานบริการแก้ไขปัญหา และปรับปรุงระบบประจำเดือน' },
  { name: 'งานประชุมและวางแผนภายใน (Internal)', code: 'PRJ-INT-06', client: 'T-NET Co., Ltd.', status: 'active', description: 'งานประชุมทีม วางแผนกลยุทธ์ และสัมมนาประจำปี' },
  { name: 'งานวิจัยและพัฒนาเทคโนโลยีใหม่ (R&D)', code: 'PRJ-RND-07', client: 'T-NET Co., Ltd.', status: 'active', description: 'ศึกษาและทดสอบเทคโนโลยี Generative AI และ Cloud Native' },
];

export default function MasterDataManager({ initialTab = 'departments' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'departments');
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);

  // ปรับแท็บตาม prop initialTab เมื่อเปลี่ยน โดยไม่ใช้ Effect
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  // ข้อมูลแต่ละตาราง
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  // สถานะโหลดและการประมวลผล
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal States
  const [modalType, setModalType] = useState(null); // 'add' | 'edit' | 'delete'
  const [currentEntity, setCurrentEntity] = useState(null);
  const [formData, setFormData] = useState({});

  // ตรวจสอบสิทธิ์ Admin หรือ Supervisor
  const userRole = user?.role || 'staff';
  const hasAccess = userRole === 'admin' || userRole === 'supervisor';

  // แจ้งเตือน Toast ชั่วคราว
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // รีโหลดข้อมูล Master Data สำหรับเรียกจาก Event Handlers
  const reloadAllData = useCallback(async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const [deptSnap, posSnap, projSnap, userSnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'positions')),
          getDocs(collection(db, 'projects')),
          getDocs(collection(db, 'users')),
        ]);

        setDepartments(deptSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPositions(posSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setProjects(projSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } else {
        setDepartments(DEFAULT_DEPARTMENTS_SEED.map((d, i) => ({ id: `dept-${i + 1}`, ...d })));
        setPositions(DEFAULT_POSITIONS_SEED.map((p, i) => ({ id: `pos-${i + 1}`, ...p })));
        setProjects(DEFAULT_PROJECTS_SEED.map((pr, i) => ({ id: `prj-${i + 1}`, ...pr })));
      }
    } catch (err) {
      console.error('Error reloading master data:', err);
      showToast('ไม่สามารถดึงข้อมูลได้: ' + (err.message || 'เกิดข้อผิดพลาด'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลครั้งแรกเมื่อ Mount (ไม่มี synchronous setState ใน effect)
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        if (isFirebaseConfigured()) {
          const [deptSnap, posSnap, projSnap, userSnap] = await Promise.all([
            getDocs(collection(db, 'departments')),
            getDocs(collection(db, 'positions')),
            getDocs(collection(db, 'projects')),
            getDocs(collection(db, 'users')),
          ]);

          if (isMounted) {
            setDepartments(deptSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setPositions(posSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setProjects(projSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setUsers(userSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
          }
        } else {
          await Promise.resolve();
          if (isMounted) {
            setDepartments(DEFAULT_DEPARTMENTS_SEED.map((d, i) => ({ id: `dept-${i + 1}`, ...d })));
            setPositions(DEFAULT_POSITIONS_SEED.map((p, i) => ({ id: `pos-${i + 1}`, ...p })));
            setProjects(DEFAULT_PROJECTS_SEED.map((pr, i) => ({ id: `prj-${i + 1}`, ...pr })));
            setUsers([
              {
                id: 'demo-staff-01',
                displayName: 'สมชาย ใจมั่นคง',
                email: 'staff@tnet.co.th',
                employeeId: 'EMP-1001',
                role: 'staff',
                department: 'ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)',
                position: 'Senior Fullstack Engineer',
                status: 'active',
              },
              {
                id: 'demo-sup-01',
                displayName: 'ประภาส รัตนวิบูลย์ (หัวหน้างาน)',
                email: 'supervisor@tnet.co.th',
                employeeId: 'SUP-001',
                role: 'supervisor',
                department: 'ฝ่ายบริหารโครงการ (Project Management)',
                position: 'Engineering Director / Supervisor',
                status: 'active',
              },
            ]);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching master data:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset ฟอร์มและตัวกรองเมื่อเปลี่ยนแท็บ
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setFilterDepartment('all');
    setFilterRole('all');
    setFilterStatus('all');
    setModalType(null);
  };

  // เปิด Modal เพิ่มข้อมูล
  const handleOpenAdd = () => {
    if (activeTab === 'departments') {
      setFormData({ name: '', code: '', description: '', status: 'active' });
    } else if (activeTab === 'positions') {
      const defaultDept = departments[0]?.name || '';
      setFormData({ name: '', code: '', departmentName: defaultDept, level: 'Senior / อาวุโส', status: 'active' });
    } else if (activeTab === 'projects') {
      setFormData({ name: '', code: '', client: '', status: 'active', description: '' });
    } else if (activeTab === 'users') {
      setFormData({
        displayName: '',
        email: '',
        employeeId: '',
        role: 'staff',
        department: departments[0]?.name || '',
        position: positions[0]?.name || '',
        status: 'active',
      });
    }
    setCurrentEntity(null);
    setModalType('add');
  };

  // เปิด Modal แก้ไขข้อมูล
  const handleOpenEdit = (item) => {
    setCurrentEntity(item);
    setFormData({ ...item });
    setModalType('edit');
  };

  // เปิด Modal ยืนยันการลบ
  const handleOpenDelete = (item) => {
    setCurrentEntity(item);
    setModalType('delete');
  };

  // บันทึกการเพิ่มหรือแก้ไข (CRUD Submit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const collectionName = getCollectionName(activeTab);

      if (modalType === 'add') {
        const payload = {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (isFirebaseConfigured()) {
          if (activeTab === 'users' && formData.email) {
            // สร้างเอกสาร user ด้วย custom id หรือ auto id
            await addDoc(collection(db, collectionName), payload);
          } else {
            await addDoc(collection(db, collectionName), payload);
          }
        } else {
          // Mock mode
          const newId = `mock-${Date.now()}`;
          const newItem = { id: newId, ...payload };
          if (activeTab === 'departments') setDepartments((prev) => [newItem, ...prev]);
          if (activeTab === 'positions') setPositions((prev) => [newItem, ...prev]);
          if (activeTab === 'projects') setProjects((prev) => [newItem, ...prev]);
          if (activeTab === 'users') setUsers((prev) => [newItem, ...prev]);
        }

        showToast('เพิ่มข้อมูลสำเร็จเรียบร้อย');
      } else if (modalType === 'edit' && currentEntity?.id) {
        const payload = {
          ...formData,
          updatedAt: serverTimestamp(),
        };
        delete payload.id;

        if (isFirebaseConfigured()) {
          await updateDoc(doc(db, collectionName, currentEntity.id), payload);
        } else {
          // Mock mode
          const updateState = (setter) =>
            setter((prev) =>
              prev.map((item) => (item.id === currentEntity.id ? { ...item, ...payload } : item))
            );
          if (activeTab === 'departments') updateState(setDepartments);
          if (activeTab === 'positions') updateState(setPositions);
          if (activeTab === 'projects') updateState(setProjects);
          if (activeTab === 'users') updateState(setUsers);
        }

        showToast('บันทึกการแก้ไขข้อมูลสำเร็จ');
      }

      setModalType(null);
      if (isFirebaseConfigured()) {
        await reloadAllData();
      }
    } catch (err) {
      console.error('Error saving data:', err);
      showToast('ไม่สามารถบันทึกข้อมูลได้: ' + (err.message || 'เกิดข้อผิดพลาด'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ยืนยันการลบข้อมูล
  const handleConfirmDelete = async () => {
    if (!currentEntity?.id) return;
    setActionLoading(true);

    try {
      const collectionName = getCollectionName(activeTab);

      if (isFirebaseConfigured()) {
        await deleteDoc(doc(db, collectionName, currentEntity.id));
      } else {
        const filterState = (setter) =>
          setter((prev) => prev.filter((item) => item.id !== currentEntity.id));
        if (activeTab === 'departments') filterState(setDepartments);
        if (activeTab === 'positions') filterState(setPositions);
        if (activeTab === 'projects') filterState(setProjects);
        if (activeTab === 'users') filterState(setUsers);
      }

      showToast('ลบรายการเรียบร้อยแล้ว');
      setModalType(null);
      if (isFirebaseConfigured()) {
        await reloadAllData();
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      showToast('ไม่สามารถลบรายการได้: ' + (err.message || 'เกิดข้อผิดพลาด'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ฟังก์ชัน Seed ข้อมูลเริ่มต้นใน 1 คลิก
  const handleSeedDefaults = async () => {
    setActionLoading(true);
    try {
      if (activeTab === 'departments') {
        for (const item of DEFAULT_DEPARTMENTS_SEED) {
          if (isFirebaseConfigured()) {
            await addDoc(collection(db, 'departments'), { ...item, createdAt: serverTimestamp() });
          }
        }
      } else if (activeTab === 'positions') {
        for (const item of DEFAULT_POSITIONS_SEED) {
          if (isFirebaseConfigured()) {
            await addDoc(collection(db, 'positions'), { ...item, createdAt: serverTimestamp() });
          }
        }
      } else if (activeTab === 'projects') {
        for (const item of DEFAULT_PROJECTS_SEED) {
          if (isFirebaseConfigured()) {
            await addDoc(collection(db, 'projects'), { ...item, createdAt: serverTimestamp() });
          }
        }
      }

      showToast(`นำเข้าชุดข้อมูลเริ่มต้นสำหรับ ${activeTab} สำเร็จ`);
      await reloadAllData();
    } catch (err) {
      console.error('Error seeding data:', err);
      showToast('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // กรองข้อมูล Departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchSearch =
        !searchTerm ||
        (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = filterStatus === 'all' || d.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [departments, searchTerm, filterStatus]);

  // กรองข้อมูล Positions
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const matchSearch =
        !searchTerm ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDept = filterDepartment === 'all' || p.departmentName === filterDepartment;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [positions, searchTerm, filterDepartment, filterStatus]);

  // กรองข้อมูล Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((pr) => {
      const matchSearch =
        !searchTerm ||
        (pr.name && pr.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pr.code && pr.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pr.client && pr.client.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = filterStatus === 'all' || pr.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  // กรองข้อมูล Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = u.displayName || u.name || '';
      const email = u.email || '';
      const empId = u.employeeId || '';
      const matchSearch =
        !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = filterRole === 'all' || u.role === filterRole;
      const matchDept = filterDepartment === 'all' || u.department === filterDepartment;
      const matchStatus = filterStatus === 'all' || (u.status || 'active') === filterStatus;

      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, searchTerm, filterRole, filterDepartment, filterStatus]);

  // ตรวจสอบสิทธิ์การเข้าถึง
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
            ซึ่งไม่มีสิทธิ์เข้าถึงหน้าจัดการข้อมูลพื้นฐานนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์
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
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white transition-all transform animate-bounce-short ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลพื้นฐาน (Master Data)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Admin & Supervisor
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            ศูนย์กลางการบริหารจัดการ แผนก, ตำแหน่งงาน, โครงการ และบัญชีผู้ใช้งานระบบ
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={reloadAllData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg shadow-sm transition"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{getAddButtonText(activeTab)}</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* แผนก */}
        <div
          onClick={() => handleTabChange('departments')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">แผนกทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{departments.length}</span>
            <span className="text-xs text-gray-500">แผนก</span>
          </div>
        </div>

        {/* ตำแหน่ง */}
        <div
          onClick={() => handleTabChange('positions')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'positions'
              ? 'bg-indigo-50/70 border-indigo-400 shadow-sm ring-1 ring-indigo-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">ตำแหน่งงาน</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{positions.length}</span>
            <span className="text-xs text-gray-500">ตำแหน่ง</span>
          </div>
        </div>

        {/* โครงการ */}
        <div
          onClick={() => handleTabChange('projects')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">โครงการทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{projects.length}</span>
            <span className="text-xs text-gray-500">โครงการ</span>
          </div>
        </div>

        {/* ผู้ใช้งาน */}
        <div
          onClick={() => handleTabChange('users')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-purple-50/70 border-purple-400 shadow-sm ring-1 ring-purple-400'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">ผู้ใช้งานในระบบ</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{users.length}</span>
            <span className="text-xs text-gray-500">บัญชี</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'departments', label: '🏢 แผนก (Departments)', count: departments.length },
          { key: 'positions', label: '💼 ตำแหน่ง (Positions)', count: positions.length },
          { key: 'projects', label: '📁 โครงการ (Projects)', count: projects.length },
          { key: 'users', label: '👥 ผู้ใช้งาน (Users)', count: users.length },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={getSearchPlaceholder(activeTab)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Extra Filters per Tab */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter (For Positions and Users) */}
          {(activeTab === 'positions' || activeTab === 'users') && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกแผนก</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Role Filter (For Users) */}
          {activeTab === 'users' && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกบทบาท (Roles)</option>
              <option value="staff">Staff (พนักงาน)</option>
              <option value="supervisor">Supervisor (หัวหน้างาน)</option>
              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">เปิดใช้งาน (Active)</option>
            <option value="inactive">ปิดใช้งาน (Inactive)</option>
            {activeTab === 'projects' && (
              <>
                <option value="completed">เสร็จสิ้น (Completed)</option>
                <option value="on_hold">ระงับชั่วคราว (On Hold)</option>
              </>
            )}
          </select>

          {/* Seed Defaults Button */}
          {activeTab !== 'users' && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
              title="นำเข้าข้อมูลมาตรฐานเริ่มต้น"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>นำเข้าข้อมูลเริ่มต้น</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area based on Active Tab */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-sm">กำลังโหลดข้อมูล Master Data...</p>
          </div>
        ) : (
          <>
            {/* 1. DEPARTMENTS TABLE */}
            {activeTab === 'departments' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">ชื่อแผนก</th>
                      <th className="px-6 py-3.5">รหัสแผนก</th>
                      <th className="px-6 py-3.5">คำอธิบาย / รายละเอียด</th>
                      <th className="px-6 py-3.5 text-center">สถานะ</th>
                      <th className="px-6 py-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                          ไม่พบข้อมูลแผนก{' '}
                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="text-blue-600 underline font-medium ml-1"
                          >
                            เพิ่มแผนกใหม่
                          </button>{' '}
                          หรือ{' '}
                          <button
                            type="button"
                            onClick={handleSeedDefaults}
                            className="text-amber-600 underline font-medium"
                          >
                            นำเข้าข้อมูลเริ่มต้น
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <tr key={dept.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>{dept.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700">
                              {dept.code || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                            {dept.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                dept.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {dept.status === 'inactive' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(dept)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(dept)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. POSITIONS TABLE */}
            {activeTab === 'positions' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">ชื่อตำแหน่ง</th>
                      <th className="px-6 py-3.5">รหัสตำแหน่ง</th>
                      <th className="px-6 py-3.5">สังกัดแผนก</th>
                      <th className="px-6 py-3.5">ระดับ / Level</th>
                      <th className="px-6 py-3.5 text-center">สถานะ</th>
                      <th className="px-6 py-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredPositions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                          ไม่พบข้อมูลตำแหน่ง{' '}
                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="text-blue-600 underline font-medium ml-1"
                          >
                            เพิ่มตำแหน่งใหม่
                          </button>{' '}
                          หรือ{' '}
                          <button
                            type="button"
                            onClick={handleSeedDefaults}
                            className="text-amber-600 underline font-medium"
                          >
                            นำเข้าข้อมูลเริ่มต้น
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredPositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2.5">
                            <Briefcase className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span>{pos.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700">
                              {pos.code || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{pos.departmentName || '-'}</td>
                          <td className="px-6 py-4 text-gray-500">{pos.level || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                pos.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {pos.status === 'inactive' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(pos)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(pos)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. PROJECTS TABLE */}
            {activeTab === 'projects' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">ชื่อโครงการ</th>
                      <th className="px-6 py-3.5">รหัสโครงการ</th>
                      <th className="px-6 py-3.5">ลูกค้า / หน่วยงาน</th>
                      <th className="px-6 py-3.5">รายละเอียด / หมายเหตุ</th>
                      <th className="px-6 py-3.5 text-center">สถานะโครงการ</th>
                      <th className="px-6 py-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                          ไม่พบข้อมูลโครงการ{' '}
                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="text-blue-600 underline font-medium ml-1"
                          >
                            เพิ่มโครงการใหม่
                          </button>{' '}
                          หรือ{' '}
                          <button
                            type="button"
                            onClick={handleSeedDefaults}
                            className="text-amber-600 underline font-medium"
                          >
                            นำเข้าโครงการเริ่มต้น
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((prj) => (
                        <tr key={prj.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{prj.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700">
                              {prj.code || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{prj.client || '-'}</td>
                          <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                            {prj.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusBadge(prj.status)}`}
                            >
                              {getProjectStatusLabel(prj.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(prj)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(prj)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                                title="ลบ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. USERS TABLE */}
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">ชื่อ-นามสกุล / อีเมล</th>
                      <th className="px-6 py-3.5">รหัสพนักงาน</th>
                      <th className="px-6 py-3.5">สิทธิ์ผู้ใช้ (Role)</th>
                      <th className="px-6 py-3.5">สังกัดแผนก</th>
                      <th className="px-6 py-3.5">ตำแหน่ง</th>
                      <th className="px-6 py-3.5 text-center">สถานะ</th>
                      <th className="px-6 py-3.5 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                          ไม่พบบัญชีผู้ใช้งานที่ตรงตามเงื่อนไข{' '}
                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="text-blue-600 underline font-medium ml-1"
                          >
                            เพิ่มผู้ใช้งานใหม่
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const name = u.displayName || u.name || 'ไม่ระบุชื่อ';
                        const role = u.role || 'staff';
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{name}</div>
                              <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-700">
                                {u.employeeId || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getUserRoleBadge(role)}`}
                              >
                                {getUserRoleLabel(role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{u.department || '-'}</td>
                            <td className="px-6 py-4 text-gray-500">{u.position || '-'}</td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  u.status === 'inactive'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {u.status === 'inactive' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(u)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                                  title="แก้ไขสิทธิ์และข้อมูลผู้ใช้"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(u)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                                  title="ลบผู้ใช้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===================== MODAL DIALOGS ===================== */}

      {/* MODAL: ADD / EDIT DIALOG */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {getModalTitle(modalType, activeTab)}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* DEPARTMENTS FORM */}
              {activeTab === 'departments' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      ชื่อแผนก <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      รหัสแผนก
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น DEV, SEC, CLOUD"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      คำอธิบาย / รายละเอียด
                    </label>
                    <textarea
                      rows={3}
                      placeholder="อธิบายหน้าที่ความรับผิดชอบของแผนก..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      สถานะ
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">เปิดใช้งาน (Active)</option>
                      <option value="inactive">ปิดใช้งาน (Inactive)</option>
                    </select>
                  </div>
                </>
              )}

              {/* POSITIONS FORM */}
              {activeTab === 'positions' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      ชื่อตำแหน่ง <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น Senior Fullstack Engineer"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        รหัสตำแหน่ง
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น SFE-01"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        ระดับ (Level)
                      </label>
                      <select
                        value={formData.level || 'Senior / อาวุโส'}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Executive / ผู้บริหาร">Executive / ผู้บริหาร</option>
                        <option value="Manager / ผู้จัดการ">Manager / ผู้จัดการ</option>
                        <option value="Senior / อาวุโส">Senior / อาวุโส</option>
                        <option value="Middle / ปฏิบัติการ">Middle / ปฏิบัติการ</option>
                        <option value="Junior / เริ่มต้น">Junior / เริ่มต้น</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      สังกัดแผนก
                    </label>
                    <select
                      value={formData.departmentName || ''}
                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- ไม่ระบุแผนก --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      สถานะ
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">เปิดใช้งาน (Active)</option>
                      <option value="inactive">ปิดใช้งาน (Inactive)</option>
                    </select>
                  </div>
                </>
              )}

              {/* PROJECTS FORM */}
              {activeTab === 'projects' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      ชื่อโครงการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น ระบบ Staff Work Report"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        รหัสโครงการ
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น PRJ-2026-01"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        สถานะโครงการ
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">กำลังดำเนินงาน (Active)</option>
                        <option value="completed">เสร็จสิ้น (Completed)</option>
                        <option value="on_hold">ระงับชั่วคราว (On Hold)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      ลูกค้า / หน่วยงาน
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ลูกค้าธนาคาร, องค์กรภาครัฐ, T-NET Internal"
                      value={formData.client || ''}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      รายละเอียดโครงการ
                    </label>
                    <textarea
                      rows={3}
                      placeholder="รายละเอียด ขอบเขตงาน หรือหมายเหตุ..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* USERS FORM */}
              {activeTab === 'users' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจมั่นคง"
                      value={formData.displayName || formData.name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        อีเมล <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={modalType === 'edit'}
                        placeholder="staff@tnet.co.th"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        รหัสพนักงาน
                      </label>
                      <input
                        type="text"
                        placeholder="EMP-1001"
                        value={formData.employeeId || ''}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        สิทธิ์ผู้ใช้งาน (Role)
                      </label>
                      <select
                        value={formData.role || 'staff'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="staff">Staff (พนักงานทั่วไป)</option>
                        <option value="supervisor">Supervisor (หัวหน้างาน)</option>
                        <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        สถานะการใช้งาน
                      </label>
                      <select
                        value={formData.status || 'active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">เปิดใช้งาน (Active)</option>
                        <option value="inactive">ปิดใช้งาน (Inactive)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      สังกัดแผนก
                    </label>
                    <select
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- ไม่ระบุแผนก --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      ตำแหน่งงาน
                    </label>
                    <select
                      value={formData.position || ''}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- ไม่ระบุตำแหน่ง --</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:bg-gray-400"
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{actionLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION DIALOG */}
      {modalType === 'delete' && currentEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบรายการ</h3>
              <p className="text-sm text-gray-500">
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการ &ldquo;
                <strong className="text-gray-900">
                  {currentEntity.name || currentEntity.displayName || currentEntity.email}
                </strong>
                &rdquo;? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setModalType(null)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:bg-gray-400"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{actionLoading ? 'กำลังลบ...' : 'ยืนยันลบ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
