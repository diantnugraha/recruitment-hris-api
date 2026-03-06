-- AlterTable
ALTER TABLE `candidate_recruitment`
  MODIFY COLUMN `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP;
