-- Fix: Change default value from '0000-00-00 00:00:00' to NULL
ALTER TABLE `employee_request`
  MODIFY COLUMN `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  MODIFY COLUMN `approved_at` TIMESTAMP NULL DEFAULT NULL;
