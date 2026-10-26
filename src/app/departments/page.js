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
import styles from "./departments.module.css";
import NavBar from "@/app/components/NavBar.jsx";

// Helper to fetch all department docs
const fetchDepartments = async () => {
  const snapshot = await getDocs(collection(db, "departments"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Load data on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchDepartments();
      setDepartments(data);
      setLoading(false);
    };
    void load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const docRef = await addDoc(collection(db, "departments"), {
      name: newName.trim(),
      createdAt: serverTimestamp(),
    });
    setDepartments([...departments, { id: docRef.id, name: newName.trim() }]);
    setNewName("");
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    const deptRef = doc(db, "departments", id);
    await updateDoc(deptRef, { name: editingName.trim() });
    setDepartments(
      departments.map((d) => (d.id === id ? { ...d, name: editingName.trim() } : d))
    );
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id) => {
    const deptRef = doc(db, "departments", id);
    await deleteDoc(deptRef);
    setDepartments(departments.filter((d) => d.id !== id));
  };

  if (!isFirebaseConfigured()) {
    return <div className={styles.container}>Firebase not configured.</div>;
  }

  return (<>

    <NavBar />
    <div className={styles.container}>
      <h1 className={styles.title}>Department Management</h1>

      {/* Add new department */}
      <div className={styles.addSection}>
        <input
          type="text"
          placeholder="Department name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleAdd} className={styles.addButton}>
          Add Department
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td>
                  {editingId === dept.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className={styles.editInput}
                    />
                  ) : (
                    dept.name
                  )}
                </td>
                <td className={styles.actionsCell}>
                  {editingId === dept.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(dept.id)}
                        className={styles.saveButton}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(dept.id);
                          setEditingName(dept.name);
                        }}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
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
