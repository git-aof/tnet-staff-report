# T-NET Staff Work Report System (Next.js + Tailwind CSS + Firebase Firestore)

ระบบบันทึกรายงานการปฏิบัติงานประจำวันของพนักงาน (Staff Work Report) และหน้าค้นหา/ตรวจสอบรายงานสำหรับหัวหน้างาน (Supervisor Review) พัฒนาด้วย **Next.js (App Router)**, **Tailwind CSS** และเชื่อมต่อฐานข้อมูล **Firebase Firestore**

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── .env.local                    # กำหนดค่า Firebase Config (Environment Variables)
├── .env.local.example            # ไฟล์ตัวอย่าง Environment Variables
├── firebase.js                   # ไฟล์เชื่อมต่อ Firebase SDK (รองรับ root import)
├── postcss.config.mjs            # กำหนดค่า Tailwind CSS PostCSS
├── src/
│   ├── firebase.js               # การตั้งค่า Firebase App และเชื่อมต่อ Firestore DB
│   ├── app/
│   │   ├── globals.css           # Global Tailwind CSS Styles
│   │   ├── layout.js             # Root Layout พร้อมฟอนต์และโครงสร้างเว็บ
│   │   ├── page.js               # หน้าหลัก (Dashboard สลับหน้าระหว่าง พนักงาน / หัวหน้างาน)
│   │   ├── staff/
│   │   │   └── page.js           # Route เฉพาะสำหรับหน้าพนักงาน (/staff)
│   │   └── supervisor/
│   │       └── page.js           # Route เฉพาะสำหรับหน้าหัวหน้างาน (/supervisor)
│   ├── components/
│   │   ├── Navbar.jsx            # แถบเมนูด้านบน + สลับแท็บ + สถานะ Firebase
│   │   ├── StaffReportForm.jsx   # แบบฟอร์มกรอกรายงานประจำวันของพนักงาน
│   │   └── SupervisorSearch.jsx  # หน้าค้นหา ตัวกรอง สรุปสถิติ และตรวจรายงาน
│   └── lib/
│       └── firebase.js           # Re-export สำหรับ @/lib/firebase
```

---

## 🗄️ โครงสร้างฐานข้อมูล Firebase Firestore

ระบบจัดเก็บข้อมูลใน **Collection: `reports`** โดยแต่ละเอกสารมีฟิลด์ดังนี้:

| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | คำอธิบาย (Description) |
|---|---|---|
| `employeeId` | `string` | รหัสพนักงาน เช่น `EMP-1001` |
| `employeeName` | `string` | ชื่อ-นามสกุลพนักงาน |
| `department` | `string` | แผนก/ฝ่ายที่สังกัด |
| `position` | `string` | ตำแหน่งงาน |
| `reportDate` | `string (YYYY-MM-DD)` | วันที่ปฏิบัติงาน |
| `workType` | `string` | รูปแบบงาน (`Onsite`, `WFH`, `Client Site`, `Hybrid`) |
| `hoursWorked` | `number` | จำนวนชั่วโมงการทำงาน (เช่น 8.0) |
| `projectTitle` | `string` | ชื่องานหรือโครงการหลัก |
| `taskDetails` | `string` | รายละเอียดงานที่ปฏิบัติเสร็จสิ้น |
| `issuesFaced` | `string` | ปัญหา/อุปสรรคที่พบ (ถ้ามี) |
| `nextDayPlan` | `string` | แผนงานในวันถัดไป |
| `status` | `string` | สถานะรายงาน: `pending` (รอตรวจ), `reviewed` (ตรวจแล้ว), `approved` (อนุมัติ) |
| `supervisorComment` | `string` | ข้อคิดเห็น/ข้อเสนอแนะจากหัวหน้างาน |
| `reviewedBy` | `string` | ชื่อหัวหน้างานผู้ตรวจสอบ |
| `reviewedAt` | `Timestamp` | เวลาที่หัวหน้างานทำการตรวจ |
| `createdAt` | `Timestamp` | เวลาที่สร้างรายงาน (`serverTimestamp()`) |
| `updatedAt` | `Timestamp` | เวลาที่มีการอัปเดตข้อมูลล่าสุด |

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มใช้งาน

### 1. ติดตั้ง Dependencies (ดำเนินการแล้ว)
```bash
npm install
```

### 2. ตั้งค่า Firebase Firestore
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้าง Project ใหม่ (หรือเลือก Project เดิม)
3. ไปที่เมนู **Build > Firestore Database** แล้วกด **Create Database** (เลือก Region เช่น `asia-southeast1`)
4. ไปที่ **Project Settings > General** เลื่อนลงมาที่หัวข้อ **Your apps** แล้วกดไอคอน Web (`</>`) เพื่อลงทะเบียนแอป
5. คัดลอกค่า Config ที่ได้รับมาใส่ในไฟล์ `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **หมายเหตุ:** หากยังไม่ได้ใส่ค่าคีย์จริง ระบบมี **Demo / Preview Mode** ในตัว สามารถทดลองกรอกและค้นหารายงานได้ทันที

### 3. ตั้งค่า Security Rules บน Firestore (แนะนำช่วงเริ่มต้น)
ใน Firebase Console > Firestore Database > Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{document=**} {
      allow read, write: if true; // สำหรับช่วงทดสอบ (ควรปรับใช้ Authentication ก่อนขึ้น Production)
    }
  }
}
```

### 4. สั่งรันโปรเจกต์
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## ✨ จุดเด่นของฟังก์ชันในระบบ

### 1. หน้ากรอกรายงานของพนักงาน (`StaffReportForm.jsx`)
- กรอกข้อมูลรหัสพนักงาน, ชื่อ, แผนก, ตำแหน่ง, วันที่, จำนวนชั่วโมง
- เลือกรูปแบบการปฏิบัติงาน (`Onsite`, `WFH`, `Client Site`, `Hybrid`)
- บันทึกรายละเอียดงาน, ปัญหาที่พบ, แผนงานวันถัดไป
- มีระบบตรวจสอบความถูกต้องของข้อมูล (Validation) และแสดงรหัสอ้างอิงเอกสารเมื่อบันทึกสำเร็จ

### 2. หน้าค้นหาและตรวจสอบของหัวหน้างาน (`SupervisorSearch.jsx`)
- **สรุปสถิติ (KPIs):** แสดงจำนวนรายงานทั้งหมด, รอตรวจสอบ, อนุมัติแล้ว, รวมชั่วโมงงาน
- **ระบบค้นหาและตัวกรองอัจฉริยะ:** ค้นหาคำสำคัญ (ชื่อ, รหัส, งาน, โครงการ), กรองตามแผนก, กรองตามสถานะ, กรองตามวันที่
- **Modal ตรวจสอบงาน:** ดูรายละเอียดงานเต็มรูปแบบ พร้อมฟอร์มให้หัวหน้าปรับสถานะ (`approved`, `reviewed`) และใส่ Feedback
- **ส่งออกข้อมูล (Export CSV):** ดาวน์โหลดรายงานที่ผ่านการกรองออกมาเป็นไฟล์ Excel / CSV ได้ทันที
