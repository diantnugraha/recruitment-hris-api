-- AddColumn: agreement acceptance tracking on candidate_recruitment
ALTER TABLE `candidate_recruitment`
  ADD COLUMN `agreement_accepted_at` TIMESTAMP(0) NULL,
  ADD COLUMN `agreement_version` VARCHAR(20) NULL;
