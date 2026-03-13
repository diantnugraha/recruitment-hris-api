-- Add code field to job_levels
-- Used for identifying structural positions across environments

-- Add code column
ALTER TABLE `job_levels` ADD COLUMN `code` VARCHAR(50) NULL;

-- Create unique index
CREATE UNIQUE INDEX `job_levels_code_key` ON `job_levels`(`code`);

-- Create index for faster lookup
CREATE INDEX `job_levels_code_idx` ON `job_levels`(`code`);

-- Seed structural codes
UPDATE `job_levels` SET `code` = 'HEAD_OF_DIVISION' WHERE `name` = 'Head of Division';
UPDATE `job_levels` SET `code` = 'MANAGER' WHERE `name` = 'Manager';
