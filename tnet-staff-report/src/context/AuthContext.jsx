"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { auth, db, isFirebaseConfigured } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  quickDemoLogin: () => {},
  updateProfileData: async () => {},
  updateUserAccount: async () => {},
});

export const DEMO_USERS = {
  staff: {
    uid: "demo-staff-01",
    email: "staff@tnet.co.th",
    displayName: "สมชาย ใจมั่นคง",
    employeeId: "EMP-1001",
    name: "สมชาย ใจมั่นคง",
    department: "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
    position: "Senior Fullstack Engineer",
    role: "staff",
    isDemo: true,
  },
  supervisor: {
    uid: "demo-sup-01",
    email: "supervisor@tnet.co.th",
    displayName: "ประภาส รัตนวิบูลย์ (หัวหน้างาน)",
    employeeId: "SUP-001",
    name: "ประภาส รัตนวิบูลย์",
    department: "ฝ่ายบริหารโครงการ (Project Management)",
    position: "Engineering Director / Supervisor",
    role: "supervisor",
    isDemo: true,
  },
};

/**
 * Helper สำหรับอัปเดตข้อมูลบัญชีผู้ใช้ใน Firebase Authentication
 */
async function syncFirebaseAuthCredentials(currentUser, { name, email, newPassword, currentPassword }) {
  const normalizedEmail = email?.trim().toLowerCase();
  const emailChanged = Boolean(normalizedEmail && normalizedEmail !== currentUser.email?.toLowerCase());
  const passwordChanged = Boolean(newPassword?.trim());

  if ((emailChanged || passwordChanged) && currentPassword) {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
  }

  if (name && name !== currentUser.displayName) {
    await updateProfile(currentUser, { displayName: name });
  }

  if (emailChanged && email) {
    await updateEmail(currentUser, email.trim());
  }

  if (passwordChanged && newPassword) {
    await updatePassword(currentUser, newPassword);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      const savedDemoUser = localStorage.getItem("tnet_demo_user");
      if (savedDemoUser) {
        try {
          return JSON.parse(savedDemoUser);
        } catch {
          localStorage.removeItem("tnet_demo_user");
        }
      }
      if (!isFirebaseConfigured()) {
        return DEMO_USERS.staff;
      }
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState(() => {
    if (typeof window !== "undefined") {
      const savedDemoUser = localStorage.getItem("tnet_demo_user");
      if (savedDemoUser) {
        try {
          return JSON.parse(savedDemoUser);
        } catch {
          localStorage.removeItem("tnet_demo_user");
        }
      }
      if (!isFirebaseConfigured()) {
        return DEMO_USERS.staff;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // ตรวจสอบสถานะการล็อกอิน Firebase Auth
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          } else {
            // รอชั่วครู่เผื่อขั้นตอนลงทะเบียนกำลังบันทึกข้อมูลเข้า Firestore เพื่อป้องกันการเขียนทับด้วยข้อมูล default
            await new Promise((resolve) => setTimeout(resolve, 800));
            const recheckSnap = await getDoc(userDocRef);
            if (recheckSnap.exists()) {
              setUserProfile(recheckSnap.data());
              return;
            }

            const defaultProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || "พนักงาน T-NET",
              displayName: currentUser.displayName || "พนักงาน T-NET",
              employeeId: "EMP-" + currentUser.uid.substring(0, 4).toUpperCase(),
              department: "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
              position: "พนักงานทั่วไป",
              role: "staff",
              status: "active",
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email.split("@")[0],
            employeeId: "EMP-000",
            department: "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
            position: "พนักงาน",
            role: "staff",
          });
        }
      } else {
        const savedDemoUser = localStorage.getItem("tnet_demo_user");
        if (!savedDemoUser) {
          setUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ลงทะเบียนผู้ใช้ใหม่
  const register = useCallback(
    async ({
      email,
      password,
      name,
      employeeId,
      department,
      position,
      role = "staff",
    }) => {
      if (isFirebaseConfigured() && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        await updateProfile(newUser, { displayName: name });

        const profileData = {
          uid: newUser.uid,
          email: newUser.email,
          name,
          displayName: name,
          employeeId: employeeId || `EMP-${newUser.uid.substring(0, 4).toUpperCase()}`,
          department,
          position,
          role: role || "staff",
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "users", newUser.uid), profileData);
        setUserProfile(profileData);
        return profileData;
      }

      // Demo register
      const mockProfile = {
        uid: "demo-user-" + Date.now(),
        email,
        name,
        displayName: name,
        employeeId: employeeId || `EMP-${Date.now().toString().slice(-4)}`,
        department,
        position,
        role,
        status: "active",
        isDemo: true,
      };
      localStorage.setItem("tnet_demo_user", JSON.stringify(mockProfile));
      setUser(mockProfile);
      setUserProfile(mockProfile);
      return mockProfile;
    },
    []
  );

  // เข้าสู่ระบบ
  const login = useCallback(
    async (email, password) => {
      if (isFirebaseConfigured() && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const currentUser = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
        return currentUser;
      }

      // Mock login check
      const demo = email.toLowerCase().includes("sup")
        ? DEMO_USERS.supervisor
        : DEMO_USERS.staff;
      localStorage.setItem("tnet_demo_user", JSON.stringify(demo));
      setUser(demo);
      setUserProfile(demo);
      return demo;
    },
    []
  );

  // ออกจากระบบ
  const logout = useCallback(async () => {
    localStorage.removeItem("tnet_demo_user");
    if (isFirebaseConfigured() && auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setUserProfile(null);
  }, []);

  // สลับบัญชีทดสอบด่วน (Quick Switch Demo)
  const quickDemoLogin = useCallback((role = "staff") => {
    const target = role === "supervisor" ? DEMO_USERS.supervisor : DEMO_USERS.staff;
    localStorage.setItem("tnet_demo_user", JSON.stringify(target));
    setUser(target);
    setUserProfile(target);
  }, []);

  // อัปเดตข้อมูล Profile
  const updateProfileData = useCallback(
    async (newData) => {
      if (!user) return;
      const updated = { ...userProfile, ...newData, updatedAt: new Date().toISOString() };
      if (isFirebaseConfigured() && !userProfile?.isDemo) {
        await setDoc(doc(db, "users", user.uid), updated, { merge: true });
      } else {
        localStorage.setItem("tnet_demo_user", JSON.stringify(updated));
      }
      setUserProfile(updated);
    },
    [user, userProfile]
  );

  // อัปเดตข้อมูลผู้ใช้งานและบัญชี (ชื่อ-นามสกุล, อีเมล, รหัสพนักงาน, แผนก, ตำแหน่ง, รหัสผ่าน)
  const updateUserAccount = useCallback(
    async ({
      name,
      email,
      employeeId,
      department,
      position,
      currentPassword,
      newPassword,
    }) => {
      if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบ");

      if (isFirebaseConfigured() && !userProfile?.isDemo && auth?.currentUser) {
        const currentUser = auth.currentUser;

        await syncFirebaseAuthCredentials(currentUser, {
          name,
          email,
          newPassword,
          currentPassword,
        });

        // บันทึกข้อมูลลง Firestore ใน Collection `users`
        const userRef = doc(db, "users", currentUser.uid);
        const updatedFields = {
          name: name || currentUser.displayName || "",
          displayName: name || currentUser.displayName || "",
          email: email ? email.trim() : (currentUser.email || ""),
          employeeId: employeeId || userProfile?.employeeId || "",
          department: department || userProfile?.department || "",
          position: position || userProfile?.position || "",
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, updatedFields, { merge: true });

        const newProfile = {
          ...userProfile,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(newProfile);
        return newProfile;
      }

      // Mock / Demo update
      const updated = {
        ...userProfile,
        name: name || userProfile?.name,
        displayName: name || userProfile?.displayName,
        email: email || userProfile?.email,
        employeeId: employeeId || userProfile?.employeeId,
        department: department || userProfile?.department,
        position: position || userProfile?.position,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("tnet_demo_user", JSON.stringify(updated));
      setUser(updated);
      setUserProfile(updated);
      return updated;
    },
    [user, userProfile]
  );

  const contextValue = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      login,
      register,
      logout,
      quickDemoLogin,
      updateProfileData,
      updateUserAccount,
    }),
    [
      user,
      userProfile,
      loading,
      login,
      register,
      logout,
      quickDemoLogin,
      updateProfileData,
      updateUserAccount,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
