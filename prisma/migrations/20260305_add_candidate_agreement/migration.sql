-- AlterTable: Add agreement consent tracking fields to candidate_recruitment
ALTER TABLE `candidate_recruitment`
  ADD COLUMN `agreement_accepted_at` TIMESTAMP NULL DEFAULT NULL AFTER `document_2`,
  ADD COLUMN `agreement_version` VARCHAR(20) NULL DEFAULT NULL AFTER `agreement_accepted_at`;
