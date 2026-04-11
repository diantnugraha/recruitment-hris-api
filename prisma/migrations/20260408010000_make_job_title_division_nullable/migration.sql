-- AlterTable: make division_id nullable to match schema
ALTER TABLE `job_titles` MODIFY COLUMN `division_id` INT NULL;

-- Backfill: legacy rows used 0 to mean "no division"
UPDATE `job_titles` SET `division_id` = NULL WHERE `division_id` = 0;
