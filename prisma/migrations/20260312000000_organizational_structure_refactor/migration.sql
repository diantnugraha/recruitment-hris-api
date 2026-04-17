-- Organizational Structure Refactor Migration
-- =====================================================
-- Changes:
-- 1. Division: add obsId, isManagement, headOfDivisionId, deputyHeadId
-- 2. Department: add managerId (keep category)
-- 3. OBS: add code
-- Note: department_id already exists in employee_list
-- =====================================================

-- ============================================
-- STEP 1: Add new columns to divisions
-- ============================================
ALTER TABLE `divisions`
  ADD COLUMN `obs_id` BIGINT UNSIGNED NULL,
  ADD COLUMN `is_management` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `head_of_division_id` INTEGER NULL,
  ADD COLUMN `deputy_head_id` INTEGER NULL;

-- ============================================
-- STEP 2: Add new columns to departments
-- ============================================
ALTER TABLE `departments`
  ADD COLUMN `manager_id` INTEGER NULL;

-- ============================================
-- STEP 3: Add code column to obs
-- ============================================
ALTER TABLE `obs`
  ADD COLUMN `code` VARCHAR(50) NULL;

-- ============================================
-- STEP 3b: Drop departments.obs_id (moved to divisions)
-- Must drop FK and column before altering obs.id type
-- ============================================
ALTER TABLE `departments` DROP FOREIGN KEY `departments_obs_id_fkey`;
DROP INDEX `departments_obs_id_idx` ON `departments`;
ALTER TABLE `departments` DROP COLUMN `obs_id`;

-- ============================================
-- STEP 3c: Alter obs.id from INTEGER to BIGINT UNSIGNED
-- (Prisma schema declares @db.UnsignedBigInt but init migration created as INTEGER)
-- ============================================
ALTER TABLE `obs`
  MODIFY COLUMN `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- ============================================
-- STEP 4: Create indexes
-- ============================================
CREATE INDEX `divisions_obs_id_idx` ON `divisions`(`obs_id`);
CREATE INDEX `divisions_is_management_idx` ON `divisions`(`is_management`);
CREATE INDEX `obs_code_idx` ON `obs`(`code`);

-- ============================================
-- STEP 5: Create unique constraints for structural positions
-- ============================================
CREATE UNIQUE INDEX `divisions_head_of_division_id_key` ON `divisions`(`head_of_division_id`);
CREATE UNIQUE INDEX `divisions_deputy_head_id_key` ON `divisions`(`deputy_head_id`);
CREATE UNIQUE INDEX `departments_manager_id_key` ON `departments`(`manager_id`);

-- ============================================
-- STEP 6: Add foreign key constraints
-- ============================================

-- Division -> OBS
ALTER TABLE `divisions`
  ADD CONSTRAINT `divisions_obs_id_fkey`
  FOREIGN KEY (`obs_id`) REFERENCES `obs`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Division -> Head of Division (Employee)
ALTER TABLE `divisions`
  ADD CONSTRAINT `divisions_head_of_division_id_fkey`
  FOREIGN KEY (`head_of_division_id`) REFERENCES `employee_list`(`employee_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Division -> Deputy Head (Employee)
ALTER TABLE `divisions`
  ADD CONSTRAINT `divisions_deputy_head_id_fkey`
  FOREIGN KEY (`deputy_head_id`) REFERENCES `employee_list`(`employee_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Department -> Manager (Employee)
ALTER TABLE `departments`
  ADD CONSTRAINT `departments_manager_id_fkey`
  FOREIGN KEY (`manager_id`) REFERENCES `employee_list`(`employee_id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
