"use client";
import React, { useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "@/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import styles from "./users.module.css";
import NavBar from "@/app/components/NavBar.jsx";
import { useAuth } from "@/context/AuthContext";
import adminWhitelist from "@/config/adminWhitelist.json";

// Helper to fetch all user docs
const fetchUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user: currentUser } = useAuth() || {};

  // Load data on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
      setLoading(false);
    };
    void load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    const docRef = await addDoc(collection(db, "users"), {
      name: newName.trim(),
      email: newEmail.trim(),
      role: "staff",
      createdAt: serverTimestamp(),
    });
    setUsers([...users, { id: docRef.id, name: newName.trim(), email: newEmail.trim(), role: "staff" }]);
    setNewName("");
    setNewEmail("");
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim() || !editingEmail.trim()) return;
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, { name: editingName.trim(), email: editingEmail.trim() });
    setUsers(
      users.map((u) => (u.id === id ? { ...u, name: editingName.trim(), email: editingEmail.trim() } : u))
    );
    setEditingId(null);
    setEditingName("");
    setEditingEmail("");
  };

  const handleDelete = async (id) => {
    const userRef = doc(db, "users", id);
    await deleteDoc(userRef);
    setUsers(users.filter((u) => u.id !== id));
  };

  if (!isFirebaseConfigured()) {
    return <div className={styles.container}>Firebase not configured.</div>;
  }

  // Determine which users are visible to the current viewer
  const visibleUsers = users.filter((u) => {
    if (!currentUser) return false;
    if (adminWhitelist?.includes(currentUser.uid)) return true;
    return u.id === currentUser.uid;
  });

  // Apply search filter on visible users
  const filteredUsers = visibleUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });
return (
    <>
  <NavBar />
  <div className={styles.container}>
      <h1 className={styles.title}>User Management</h1>

      {/* Search bar */}
      <div className={styles.addSection}>
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.input}
        />
      </div>

      {/* Add new user */}
      <div className={styles.addSection}>
        <input
          type="text"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <input
          type="email"
          placeholder="Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleAdd} className={styles.addButton}>
          Add User
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  {editingId === user.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className={styles.editInput}
                    />
                  ) : (
                    user.name
                  )}
                </td>
                <td>
                  {editingId === user.id ? (
                    <input
                      type="email"
                      value={editingEmail}
                      onChange={(e) => setEditingEmail(e.target.value)}
                      className={styles.editInput}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className={styles.actionsCell}>
                  {editingId === user.id ? (
                    <>
                      <button onClick={() => handleUpdate(user.id)} className={styles.saveButton}>Save</button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                          setEditingEmail("");
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                        {user.id === currentUser?.uid && !user.approved && (
                          <button
                            onClick={() => {
                              setEditingId(user.id);
                              setEditingName(user.name);
                              setEditingEmail(user.email);
                            }}
                            className={styles.editButton}
                          >
                            Edit
                          </button>
                        )}
                      {adminWhitelist?.includes(currentUser?.uid) && (
                        <button onClick={() => handleDelete(user.id)} className={styles.deleteButton}>Delete</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div></>
  );
}
