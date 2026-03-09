-- CreateTable
CREATE TABLE `candidate_assessment_scoring` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `assessment_id` BIGINT UNSIGNED NOT NULL,
    `stage` ENUM('interview1', 'interview2') NOT NULL,
    `relevance_of_experience` TINYINT NOT NULL,
    `training_undertaken` TINYINT NOT NULL,
    `technical_skills` TINYINT NOT NULL,
    `non_technical_skills` TINYINT NOT NULL,
    `communication_skills` TINYINT NOT NULL,
    `emotional_maturity` TINYINT NOT NULL,
    `understanding_of_position` TINYINT NOT NULL,
    `teamwork_ability` TINYINT NOT NULL,
    `total_score` TINYINT NOT NULL,
    `conclusion` ENUM('proceed', 'recommended', 'rejected') NOT NULL,
    `key_competencies` JSON NULL,
    `interviewer_notes` JSON NULL,
    `assessed_by` VARCHAR(50) NULL,
    `assessed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `candidate_assessment_scoring_assessment_id_stage_key`(`assessment_id`, `stage`),
    INDEX `candidate_assessment_scoring_assessment_id_idx`(`assessment_id`),
    INDEX `candidate_assessment_scoring_stage_idx`(`stage`),
    INDEX `candidate_assessment_scoring_conclusion_idx`(`conclusion`),
    INDEX `candidate_assessment_scoring_total_score_idx`(`total_score`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `candidate_assessment_scoring` ADD CONSTRAINT `candidate_assessment_scoring_assessment_id_fkey` FOREIGN KEY (`assessment_id`) REFERENCES `candidate_recruitment_assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
