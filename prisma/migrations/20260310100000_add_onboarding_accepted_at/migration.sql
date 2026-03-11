-- AlterTable: Add onboarding_accepted_at to candidate_recruitment_onboarding
ALTER TABLE `candidate_recruitment_onboarding` ADD COLUMN `onboarding_accepted_at` TIMESTAMP(0) NULL;
