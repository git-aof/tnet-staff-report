// src/app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        void (async () => {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                router.push('/staff');
            } catch (err) {
                console.error('Login Error:', err);
                setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            } finally {
                setLoading(false);
            }
        })();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-900">เข้าสู่ระบบ</h2>

                {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">อีเมล</label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full border p-2 rounded-md"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                        <input
                            id="login-password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full border p-2 rounded-md"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    ยังไม่มีบัญชีผู้ใช้?{' '}
                    <Link href="/register" className="text-blue-600 hover:underline">
                        ลงทะเบียน
                    </Link>
                </p>
            </div>
        </div>
    );
}