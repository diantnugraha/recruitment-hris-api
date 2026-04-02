-- CreateTable
CREATE TABLE `facility_pics` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `facility_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `facility_pics_facility_id_idx`(`facility_id`),
    INDEX `facility_pics_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_pics` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `program_id` BIGINT UNSIGNED NOT NULL,
    `employee_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `program_pics_program_id_idx`(`program_id`),
    INDEX `program_pics_employee_id_idx`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddColumn: join_date to candidate_recruitment_onboarding
ALTER TABLE `candidate_recruitment_onboarding` ADD COLUMN `join_date` VARCHAR(20) NULL;

-- AddUniqueConstraint: inventory_no on facillities
ALTER TABLE `facillities` ADD CONSTRAINT `facillities_inventory_no_key` UNIQUE (`inventory_no`);

-- AddForeignKey: facility_pics -> facillities
ALTER TABLE `facility_pics` ADD CONSTRAINT `facility_pics_facility_id_fkey` FOREIGN KEY (`facility_id`) REFERENCES `facillities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: program_pics -> onboarding_program
ALTER TABLE `program_pics` ADD CONSTRAINT `program_pics_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `onboarding_program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: facility_pics -> employee_list (RESTRICT)
ALTER TABLE `facility_pics` ADD CONSTRAINT `fk_facility_pics_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_list`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: program_pics -> employee_list (RESTRICT)
ALTER TABLE `program_pics` ADD CONSTRAINT `fk_program_pics_employee` FOREIGN KEY (`employee_id`) REFERENCES `employee_list`(`employee_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
