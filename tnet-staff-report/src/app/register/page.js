// src/app/register/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }

        setLoading(true);

        void (async () => {
            try {
                // 1. สร้างบัญชี Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
                const user = userCredential.user;

                // 2. อัปเดต Display Name
                await updateProfile(user, { displayName: formData.displayName });

                // 3. บันทึกข้อมูลลง Firestore Collection `users`
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    displayName: formData.displayName,
                    email: formData.email,
                    role: 'staff',
                    departmentId: '',
                    positionId: '',
                    createdAt: new Date(),
                });

                router.push('/staff');
            } catch (err) {
                console.error('Registration Error:', err);
                setError('ไม่สามารถลงทะเบียนได้ กรุณาตรวจสอบข้อมูลหรืออีเมลซ้ำ');
            } finally {
                setLoading(false);
            }
        })();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-900">ลงทะเบียนเข้าใช้งาน</h2>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                            ชื่อ-นามสกุล
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            name="displayName"
                            required
                            value={formData.displayName}
                            onChange={handleChange}
                            className="mt-1 w-full border p-2 rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            อีเมล
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 w-full border p-2 rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            รหัสผ่าน
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 w-full border p-2 rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            ยืนยันรหัสผ่าน
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            required
                            minLength={6}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 w-full border p-2 rounded-md"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'กำลังลงทะเบียน...' : 'สมัครสมาชิก'}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    มีบัญชีอยู่แล้ว?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        เข้าสู่ระบบ
                    </Link>
                </p>
            </div>
        </div>
    );
}