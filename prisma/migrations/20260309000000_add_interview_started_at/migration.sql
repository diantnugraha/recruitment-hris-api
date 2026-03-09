-- Add interview_started_at field to track when HR starts the interview process
ALTER TABLE `candidate_recruitment_assessment`
ADD COLUMN `interview_started_at` TIMESTAMP NULL DEFAULT NULL;
