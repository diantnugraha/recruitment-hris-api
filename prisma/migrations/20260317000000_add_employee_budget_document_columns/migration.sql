-- AlterTable: change document column from VARCHAR(100) to TEXT and make nullable
ALTER TABLE `employee_budget` MODIFY COLUMN `document` TEXT NULL;

-- AlterTable: add document_name column
ALTER TABLE `employee_budget` ADD COLUMN `document_name` VARCHAR(255) NULL;
