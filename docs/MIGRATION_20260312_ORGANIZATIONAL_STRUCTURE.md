# Migration: Organizational Structure Refactor

**Migration ID:** `20260312000000_organizational_structure_refactor`
**Date:** 2026-03-12

---

## Overview

Migrasi ini melakukan refactor struktur organisasi dengan perubahan berikut:

| Table | Perubahan |
|-------|-----------|
| `divisions` | +obs_id (FK→obs), +is_management, +head_of_division_id (FK→employee), +deputy_head_id (FK→employee) |
| `departments` | +manager_id (FK→employee) |
| `obs` | +code |

**Note:** `department_id` sudah ada di `employee_list`, tidak perlu ditambahkan.

---

## Hierarchy Struktur Organisasi

```
OBS (Business Unit)
└── Division
    ├── is_management: true  → Management/BOD (obs_id = NULL)
    ├── is_management: false → Regular Division
    ├── head_of_division_id → Employee (Head of Division)
    ├── deputy_head_id → Employee (Deputy Head)
    └── Department
        ├── manager_id → Employee (Manager)
        └── JobTitle (via junction table department_job_title)
            └── Employee
```

---

## Pre-Deployment Checklist

- [ ] Database sudah di-backup

---

## Step-by-Step Deployment

### Step 1: Backup Database

```bash
mysqldump -u [user] -p [database_name] > backup_before_migration_20260312.sql
```

### Step 2: Run Migration

```bash
npx prisma migrate deploy
```

### Step 3: Verify Migration

```sql
-- Verify new columns exist
DESCRIBE divisions;
DESCRIBE departments;
DESCRIBE obs;

-- Verify foreign keys
SELECT CONSTRAINT_NAME, TABLE_NAME
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
AND CONSTRAINT_TYPE = 'FOREIGN KEY'
AND CONSTRAINT_NAME LIKE 'divisions_%';
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

---

## Rollback Procedure

Jika migration gagal di tengah jalan, gunakan script reset:

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- Drop foreign keys (jalankan satu per satu, abaikan error jika tidak exist)
ALTER TABLE `divisions` DROP FOREIGN KEY `divisions_obs_id_fkey`;
ALTER TABLE `divisions` DROP FOREIGN KEY `divisions_head_of_division_id_fkey`;
ALTER TABLE `divisions` DROP FOREIGN KEY `divisions_deputy_head_id_fkey`;
ALTER TABLE `departments` DROP FOREIGN KEY `departments_manager_id_fkey`;

-- Drop indexes
DROP INDEX `divisions_obs_id_idx` ON `divisions`;
DROP INDEX `divisions_is_management_idx` ON `divisions`;
DROP INDEX `divisions_head_of_division_id_key` ON `divisions`;
DROP INDEX `divisions_deputy_head_id_key` ON `divisions`;
DROP INDEX `departments_manager_id_key` ON `departments`;
DROP INDEX `obs_code_idx` ON `obs`;

-- Drop new columns
ALTER TABLE `divisions` DROP COLUMN `obs_id`;
ALTER TABLE `divisions` DROP COLUMN `is_management`;
ALTER TABLE `divisions` DROP COLUMN `head_of_division_id`;
ALTER TABLE `divisions` DROP COLUMN `deputy_head_id`;
ALTER TABLE `departments` DROP COLUMN `manager_id`;
ALTER TABLE `obs` DROP COLUMN `code`;

SET FOREIGN_KEY_CHECKS = 1;

-- Mark migration as rolled back
DELETE FROM _prisma_migrations WHERE migration_name = '20260312000000_organizational_structure_refactor';
```

Setelah reset, jalankan ulang:
```bash
npx prisma migrate deploy
```

---

## New Database Schema

### Division
```
divisions
├── id (PK)
├── name
├── code
├── description
├── obs_id (FK → obs.id) [NEW] - BIGINT UNSIGNED
├── is_management (BOOLEAN default false) [NEW]
├── head_of_division_id (FK → employee_list.employee_id) [NEW] - UNIQUE
├── deputy_head_id (FK → employee_list.employee_id) [NEW] - UNIQUE
├── created_at
└── updated_at
```

### Department
```
departments
├── id (PK)
├── name
├── code
├── division_id (FK → divisions.id)
├── category (VARCHAR: 'Non Profit Center', 'Profit Center')
├── manager_id (FK → employee_list.employee_id) [NEW] - UNIQUE
├── description
├── created_at
└── updated_at
```

### OBS
```
obs
├── id (PK) - BIGINT UNSIGNED
├── name
├── code [NEW]
├── description
├── created_at
└── updated_at
```

---

## Employee → Department → JobTitle Flow

```
Input Employee Flow:
1. User pilih Department → GET /departments
2. User pilih JobTitle (filtered) → GET /departments/:id/job-titles
3. Simpan Employee dengan:
   - department_id = selected department
   - job_title_id = selected job title

Validasi: (job_title_id, department_id) harus ada di junction table department_job_title
```

---

## Troubleshooting

### Error: Duplicate column name
```
Database error code: 1060
```
**Solusi:** Column sudah ada dari partial migration sebelumnya. Jalankan rollback procedure dulu.

### Error: Referencing column incompatible
```
Database error code: 3780
```
**Solusi:** Type column tidak match. Pastikan `obs_id` menggunakan `BIGINT UNSIGNED` (sama dengan `obs.id`).

### Error: Cannot drop foreign key
```
MySQL doesn't support DROP FOREIGN KEY IF EXISTS
```
**Solusi:** Jalankan DROP FOREIGN KEY satu per satu, abaikan error jika constraint tidak exist.

---

## Contact

Jika ada masalah saat deployment, hubungi tim development.
