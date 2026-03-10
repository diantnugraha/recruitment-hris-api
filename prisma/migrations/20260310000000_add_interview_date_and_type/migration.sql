-- Add interview scheduling fields to assessment table
ALTER TABLE `candidate_recruitment_assessment`
ADD COLUMN `interview_date` TIMESTAMP NULL DEFAULT NULL,
ADD COLUMN `interview_type` ENUM('online', 'onsite') NULL DEFAULT NULL;
