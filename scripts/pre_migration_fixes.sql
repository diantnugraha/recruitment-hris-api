-- =============================================
-- PRE-MIGRATION FIXES
-- Migration: 20260312000000_organizational_structure_refactor
-- =============================================
-- Jalankan script ini SEBELUM `npx prisma migrate deploy`
-- =============================================

-- 1. FIX INVALID DATES (0000-00-00 → NULL)
SET SQL_MODE = '';

UPDATE `employee_list` SET `employee_joindate` = NULL WHERE `employee_joindate` = '0000-00-00';
UPDATE `employee_list` SET `employee_birthdate` = NULL WHERE `employee_birthdate` = '0000-00-00';
UPDATE `employee_list` SET `employee_permanentdate` = NULL WHERE `employee_permanentdate` = '0000-00-00';
UPDATE `employee_list` SET `employee_contractdate` = NULL WHERE `employee_contractdate` = '0000-00-00';
UPDATE `employee_list` SET `employee_probationdate` = NULL WHERE `employee_probationdate` = '0000-00-00';
UPDATE `employee_list` SET `employee_exitdate` = NULL WHERE `employee_exitdate` = '0000-00-00';
UPDATE `employee_list` SET `employee_probationenddate` = NULL WHERE `employee_probationenddate` = '0000-00-00';
UPDATE `employee_list` SET `employee_contractenddate` = NULL WHERE `employee_contractenddate` = '0000-00-00';

SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- 2. DELETE USERS WITH NULL EMPLOYEE_ID
DELETE FROM `users` WHERE `employee_id` IS NULL;

-- 3. VERIFICATION QUERIES (run these to check)
-- Check for remaining invalid dates:
-- SELECT COUNT(*) FROM employee_list WHERE employee_joindate = '0000-00-00';

-- Check for duplicate employee_id:
-- SELECT employee_id, COUNT(*) as cnt FROM users WHERE employee_id IS NOT NULL GROUP BY employee_id HAVING cnt > 1;

-- Check for NULL employee_id:
-- SELECT COUNT(*) FROM users WHERE employee_id IS NULL;
