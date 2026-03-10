-- CreateTable
CREATE TABLE `candidate_assessment_assignee` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `assessment_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` INT UNSIGNED NOT NULL,
    `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `candidate_assessment_assignee_assessment_id_idx`(`assessment_id`),
    INDEX `candidate_assessment_assignee_employee_id_idx`(`employee_id`),
    UNIQUE INDEX `candidate_assessment_assignee_assessment_id_employee_id_key`(`assessment_id`, `employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `candidate_assessment_assignee` ADD CONSTRAINT `candidate_assessment_assignee_assessment_id_fkey` FOREIGN KEY (`assessment_id`) REFERENCES `candidate_recruitment_assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
