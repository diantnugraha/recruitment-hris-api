-- Add recruitment_started_at to employee_request
ALTER TABLE `employee_request`
ADD COLUMN `recruitment_started_at` TIMESTAMP NULL AFTER `rejected_at`;
