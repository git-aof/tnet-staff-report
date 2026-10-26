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
import styles from "./positions.module.css";
import NavBar from "@/app/components/NavBar.jsx";

// Helper to fetch all position docs
const fetchPositions = async () => {
  const snapshot = await getDocs(collection(db, "positions"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export default function PositionsPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Load data on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchPositions();
      setPositions(data);
      setLoading(false);
    };
    void load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const docRef = await addDoc(collection(db, "positions"), {
      name: newName.trim(),
      createdAt: serverTimestamp(),
    });
    setPositions([...positions, { id: docRef.id, name: newName.trim() }]);
    setNewName("");
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    const posRef = doc(db, "positions", id);
    await updateDoc(posRef, { name: editingName.trim() });
    setPositions(
      positions.map((p) => (p.id === id ? { ...p, name: editingName.trim() } : p))
    );
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id) => {
    const posRef = doc(db, "positions", id);
    await deleteDoc(posRef);
    setPositions(positions.filter((p) => p.id !== id));
  };

  if (!isFirebaseConfigured()) {
    return <div className={styles.container}>Firebase not configured.</div>;
  }

  return (
    <>
  <NavBar />
  <div className={styles.container}>
      <h1 className={styles.title}>Position Management</h1>

      {/* Add new position */}
      <div className={styles.addSection}>
        <input
          type="text"
          placeholder="Position name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleAdd} className={styles.addButton}>
          Add Position
        </button>
      </div>

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
            {positions.map((pos) => (
              <tr key={pos.id}>
                <td>
                  {editingId === pos.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className={styles.editInput}
                    />
                  ) : (
                    pos.name
                  )}
                </td>
                <td className={styles.actionsCell}>
                  {editingId === pos.id ? (
                    <>
                      <button onClick={() => handleUpdate(pos.id)} className={styles.saveButton}>Save</button>
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
                          setEditingId(pos.id);
                          setEditingName(pos.name);
                        }}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(pos.id)} className={styles.deleteButton}>Delete</button>
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
