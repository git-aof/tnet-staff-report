"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, isFirebaseConfigured } from "@/firebase";
import adminWhitelist from "@/config/adminWhitelist.json";

// Custom hook to access AuthContext easily

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
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
            const data = userSnap.data();
            // Check admin whitelist if role not already admin
            if (data.role !== "admin" && adminWhitelist.includes(currentUser.uid)) {
              data.role = "admin";
              await setDoc(userDocRef, { ...data }, { merge: true });
            }
            setUserProfile(data);
          } else {
            const defaultProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || "พนักงาน T-NET",
              employeeId: "EMP-" + currentUser.uid.substring(0, 4).toUpperCase(),
              department: "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
              position: "พนักงานทั่วไป",
              role: adminWhitelist.includes(currentUser.uid) ? "admin" : "staff",
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
            role: adminWhitelist.includes(currentUser.uid) ? "admin" : "staff",
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
  const register = async ({
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
        employeeId: employeeId || `EMP-${newUser.uid.substring(0, 4).toUpperCase()}`,
        department,
        position,
        role: role || "staff",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", newUser.uid), profileData);
      setUserProfile(profileData);
      return profileData;
    } else {
      // Demo register
      const mockProfile = {
        uid: "demo-user-" + Date.now(),
        email,
        name,
        employeeId: employeeId || "EMP-" + Math.floor(1000 + Math.random() * 9000),
        department,
        position,
        role,
        isDemo: true,
      };
      localStorage.setItem("tnet_demo_user", JSON.stringify(mockProfile));
      setUser(mockProfile);
      setUserProfile(mockProfile);
      return mockProfile;
    }
  };

  // เข้าสู่ระบบ
  const login = async (email, password) => {
    if (isFirebaseConfigured() && auth) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
      return currentUser;
    } else {
      // Mock login check
      const demo =
        email.toLowerCase().includes("sup")
          ? DEMO_USERS.supervisor
          : DEMO_USERS.staff;
      localStorage.setItem("tnet_demo_user", JSON.stringify(demo));
      setUser(demo);
      setUserProfile(demo);
      return demo;
    }
  };

  // ออกจากระบบ
  const logout = async () => {
    localStorage.removeItem("tnet_demo_user");
    if (isFirebaseConfigured() && auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setUserProfile(null);
  };

  // สลับบัญชีทดสอบด่วน (Quick Switch Demo)
  const quickDemoLogin = (role = "staff") => {
    const target = role === "supervisor" ? DEMO_USERS.supervisor : DEMO_USERS.staff;
    localStorage.setItem("tnet_demo_user", JSON.stringify(target));
    setUser(target);
    setUserProfile(target);
  };

  // อัปเดตข้อมูล Profile
  const updateProfileData = async (newData) => {
    if (!user) return;
    const updated = { ...userProfile, ...newData, updatedAt: new Date().toISOString() };
    if (isFirebaseConfigured() && !userProfile?.isDemo) {
      await setDoc(doc(db, "users", user.uid), updated, { merge: true });
    } else {
      localStorage.setItem("tnet_demo_user", JSON.stringify(updated));
    }
    setUserProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


