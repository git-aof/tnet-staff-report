"use client";
import Link from "next/link";
import styles from "./nav.module.css";

export default function NavBar() {
  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <Link href="/departments" className={styles.link}>Departments</Link>
        </li>
        <li className={styles.item}>
          <Link href="/users" className={styles.link}>Users</Link>
        </li>
        <li className={styles.item}>
          <Link href="/positions" className={styles.link}>Positions</Link>
        </li>
        <li className={styles.item}>
          <Link href="/projects" className={styles.link}>Projects</Link>
        </li>
      </ul>
    </nav>
  );
}
