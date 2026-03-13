-- Reset Partial Migration for MySQL
-- =====================================================
-- Run this BEFORE re-running the migration
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- STEP 1: Drop foreign keys (run each separately, ignore errors)
-- ============================================
-- Run these in MySQL Workbench one by one, skip if error "Can't DROP; check that column/key exists"

-- ALTER TABLE `divisions` DROP FOREIGN KEY `divisions_obs_id_fkey`;
-- ALTER TABLE `divisions` DROP FOREIGN KEY `divisions_head_of_division_id_fkey`;
-- ALTER TABLE `divisions` DROP FOREIGN KEY `divisions_deputy_head_id_fkey`;
-- ALTER TABLE `departments` DROP FOREIGN KEY `departments_manager_id_fkey`;

-- ============================================
-- STEP 2: Drop indexes (if exist)
-- ============================================
DROP INDEX IF EXISTS `divisions_obs_id_idx` ON `divisions`;
DROP INDEX IF EXISTS `divisions_is_management_idx` ON `divisions`;
DROP INDEX IF EXISTS `obs_code_idx` ON `obs`;
DROP INDEX IF EXISTS `divisions_head_of_division_id_key` ON `divisions`;
DROP INDEX IF EXISTS `divisions_deputy_head_id_key` ON `divisions`;
DROP INDEX IF EXISTS `departments_manager_id_key` ON `departments`;

-- ============================================
-- STEP 3: Drop columns (if exist) - MySQL 8.0.23+
-- ============================================
ALTER TABLE `divisions` DROP COLUMN IF EXISTS `obs_id`;
ALTER TABLE `divisions` DROP COLUMN IF EXISTS `is_management`;
ALTER TABLE `divisions` DROP COLUMN IF EXISTS `head_of_division_id`;
ALTER TABLE `divisions` DROP COLUMN IF EXISTS `deputy_head_id`;
ALTER TABLE `departments` DROP COLUMN IF EXISTS `manager_id`;
ALTER TABLE `obs` DROP COLUMN IF EXISTS `code`;

-- ============================================
-- STEP 4: Delete Default Division (if created)
-- ============================================
DELETE FROM `divisions` WHERE `code` = 'DEFAULT';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Reset completed!' AS status;
