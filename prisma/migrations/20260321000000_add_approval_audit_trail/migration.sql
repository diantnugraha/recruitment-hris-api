-- Rename reviewed_at to hr_reviewed_at
ALTER TABLE `employee_request` CHANGE COLUMN `reviewed_at` `hr_reviewed_at` TIMESTAMP NULL DEFAULT NULL;

-- Add department_id (BIGINT UNSIGNED to match departments.id)
ALTER TABLE `employee_request` ADD COLUMN `department_id` BIGINT UNSIGNED NULL AFTER `created_by`;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_employee_request_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

-- Add audit trail columns (BIGINT UNSIGNED to match users.id)
ALTER TABLE `employee_request` ADD COLUMN `hod_reviewed_by` BIGINT UNSIGNED NULL AFTER `department_id`;
ALTER TABLE `employee_request` ADD COLUMN `hod_reviewed_at` TIMESTAMP NULL DEFAULT NULL AFTER `hod_reviewed_by`;
ALTER TABLE `employee_request` ADD COLUMN `hr_reviewed_by` BIGINT UNSIGNED NULL AFTER `hod_reviewed_at`;
ALTER TABLE `employee_request` ADD COLUMN `approved_by` BIGINT UNSIGNED NULL AFTER `approved_at`;
ALTER TABLE `employee_request` ADD COLUMN `revised_by` BIGINT UNSIGNED NULL AFTER `approved_by`;
ALTER TABLE `employee_request` ADD COLUMN `revised_at` TIMESTAMP NULL DEFAULT NULL AFTER `revised_by`;
ALTER TABLE `employee_request` ADD COLUMN `rejected_by` BIGINT UNSIGNED NULL AFTER `revised_at`;
ALTER TABLE `employee_request` ADD COLUMN `rejected_at` TIMESTAMP NULL DEFAULT NULL AFTER `rejected_by`;

-- Add foreign keys for audit columns
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_hod_reviewed_by` FOREIGN KEY (`hod_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_hr_reviewed_by` FOREIGN KEY (`hr_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_revised_by` FOREIGN KEY (`revised_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `employee_request` ADD CONSTRAINT `fk_er_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Backfill department_id from department_job_title pivot
UPDATE `employee_request` er
JOIN `department_job_title` djt ON djt.`job_title_id` = er.`job_title_id`
SET er.`department_id` = djt.`department_id`
WHERE er.`department_id` IS NULL;
