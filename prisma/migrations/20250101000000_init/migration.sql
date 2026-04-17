-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `display_name` VARCHAR(100) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `employee_id` INTEGER NULL,
    `superior_id` INTEGER NULL,
    `remember_token` VARCHAR(100) NULL,
    `email_verified_at` DATETIME(3) NULL,
    `user_imei` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `roletouser_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_access` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(45) NULL,

    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_list` (
    `employee_id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(36) NULL,
    `superior_id` INTEGER NULL,
    `employee_images` VARCHAR(255) NULL,
    `employee_bu` VARCHAR(100) NULL,
    `employee_ext` VARCHAR(50) NULL,
    `employee_gender` VARCHAR(10) NULL,
    `employee_nickname` VARCHAR(50) NULL,
    `employee_nik` VARCHAR(50) NULL,
    `employee_name` VARCHAR(100) NULL,
    `employee_contact` VARCHAR(50) NULL,
    `employee_email` VARCHAR(100) NULL,
    `employee_title` VARCHAR(100) NULL,
    `employee_status` VARCHAR(50) NULL,
    `employee_joindate` DATETIME(3) NULL,
    `employee_birthdate` DATETIME(3) NULL,
    `employee_permanentdate` DATETIME(3) NULL,
    `employee_location` VARCHAR(100) NULL,
    `employee_maritalstatus` VARCHAR(50) NULL,
    `employee_alamat` VARCHAR(255) NULL,
    `employee_religion` VARCHAR(50) NULL,
    `employee_ethnic` VARCHAR(50) NULL,
    `employee_mother` VARCHAR(100) NULL,
    `employee_father` VARCHAR(100) NULL,
    `employee_spouse` VARCHAR(100) NULL,
    `employee_emg_name` VARCHAR(200) NULL,
    `employee_emg_rel` VARCHAR(45) NULL,
    `employee_emg_phone` VARCHAR(45) NULL,
    `employee_trash` INTEGER NULL,
    `employee_sign` VARCHAR(255) NULL,

    UNIQUE INDEX `employee_list_uuid_key`(`uuid`),
    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `location` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_files_user_id_idx`(`user_id`),
    INDEX `user_files_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `cluster` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `obs_name_idx`(`name`),
    INDEX `obs_cluster_idx`(`cluster`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `divisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `divisions_name_idx`(`name`),
    INDEX `divisions_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `obs_id` INTEGER NOT NULL,
    `division_id` INTEGER NULL,
    `category` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_name_key`(`name`),
    UNIQUE INDEX `departments_code_key`(`code`),
    INDEX `departments_obs_id_idx`(`obs_id`),
    INDEX `departments_division_id_idx`(`division_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_levels` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` CHAR(100) NOT NULL,
    `category` ENUM('Functional', 'Structural') NOT NULL,
    `description` TEXT NULL,
    `can_create_job_title` BOOLEAN NOT NULL DEFAULT false,
    `can_create_kpi` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `job_levels_name_key`(`name`),
    INDEX `job_levels_name_idx`(`name`),
    INDEX `job_levels_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_titles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` CHAR(100) NOT NULL,
    `job_level_id` BIGINT UNSIGNED NOT NULL,
    `division_id` INTEGER NULL,
    `direct_report_id` BIGINT UNSIGNED NULL,
    `description` TEXT NULL,
    `purpose` TEXT NULL,
    `requirement` TEXT NULL,
    `type` ENUM('Administration', 'Technical') NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `job_titles_name_key`(`name`),
    INDEX `job_titles_job_level_id_idx`(`job_level_id`),
    INDEX `job_titles_direct_report_id_idx`(`direct_report_id`),
    INDEX `job_titles_division_id_idx`(`division_id`),
    INDEX `job_titles_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `department_job_title` (
    `job_title_id` BIGINT UNSIGNED NOT NULL,
    `department_id` INTEGER NOT NULL,

    INDEX `department_job_title_job_title_id_idx`(`job_title_id`),
    INDEX `department_job_title_department_id_idx`(`department_id`),
    PRIMARY KEY (`job_title_id`, `department_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_budget` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `department_id` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `technical` INTEGER NOT NULL,
    `admin` INTEGER NOT NULL,
    `document` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_request` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `job_title_id` INTEGER NOT NULL,
    `purpose` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `general_job_purpose` TEXT NOT NULL,
    `job_description` TEXT NOT NULL,
    `job_requirement` TEXT NOT NULL,
    `status_employee_request` INTEGER NOT NULL,
    `status_recruitment` INTEGER NOT NULL,
    `code_recruitment` VARCHAR(30) NOT NULL,
    `gender` ENUM('M', 'F', 'A') NOT NULL DEFAULT 'M',
    `age_from` INTEGER NOT NULL,
    `age_to` INTEGER NOT NULL,
    `expected_onboard_date` DATE NOT NULL,
    `job_placement` VARCHAR(30) NOT NULL,
    `is_deleted` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `education` VARCHAR(50) NOT NULL,
    `experience` VARCHAR(50) NOT NULL,
    `budget` VARCHAR(50) NOT NULL,
    `reviewed_at` TIMESTAMP(0) NULL,
    `approved_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_request_comment` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_request_id` BIGINT UNSIGNED NOT NULL,
    `user_id` INTEGER NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `employee_request_comment_employee_request_id_idx`(`employee_request_id`),
    INDEX `employee_request_comment_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `verify` ENUM('0', '1') NOT NULL,
    `token` TEXT NOT NULL,
    `email` VARCHAR(32) NOT NULL,
    `fullname` VARCHAR(32) NOT NULL,
    `address` TEXT NOT NULL,
    `resident_status` VARCHAR(32) NOT NULL,
    `birth_place` VARCHAR(32) NOT NULL,
    `birth_date` DATE NOT NULL,
    `religion` VARCHAR(32) NOT NULL,
    `ethnic_group` VARCHAR(32) NULL,
    `id_no` VARCHAR(32) NOT NULL,
    `tax_id` VARCHAR(32) NOT NULL,
    `bpjs_id` VARCHAR(32) NOT NULL,
    `citizenship` VARCHAR(32) NOT NULL,
    `marrital_status` VARCHAR(32) NOT NULL,
    `gender` ENUM('M', 'F') NULL,
    `mobile_phone` VARCHAR(32) NOT NULL,
    `driving_license` VARCHAR(32) NOT NULL,
    `document_1` TEXT NOT NULL,
    `document_2` TEXT NOT NULL,
    `agreement_accepted_at` TIMESTAMP(0) NULL,
    `agreement_version` VARCHAR(20) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_detail` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `job_title_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `candidate_code` VARCHAR(30) NOT NULL,
    `candidate_token` TEXT NOT NULL,
    `candidate_verify` ENUM('0', '1') NOT NULL,
    `employee_request_id` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_assessment` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `candidate_recruitment_detail_id` INTEGER NOT NULL,
    `interview1_desc` TEXT NOT NULL,
    `interview1_status` ENUM('0', '1', '2') NOT NULL,
    `interview2_desc` TEXT NOT NULL,
    `interview2_status` ENUM('0', '1', '2') NOT NULL,
    `mcu_desc` TEXT NOT NULL,
    `mcu_status` ENUM('0', '1', '2') NOT NULL,
    `reason_to_move` TEXT NOT NULL,
    `purpose_of_applying` TEXT NOT NULL,
    `last_salary` VARCHAR(30) NOT NULL,
    `active_language` VARCHAR(30) NOT NULL,
    `loyality` VARCHAR(30) NOT NULL,
    `when_ready_work` VARCHAR(30) NOT NULL,
    `ref_contact_name` VARCHAR(30) NOT NULL,
    `last_job_description` TEXT NOT NULL,
    `tasks_jobs` TEXT NOT NULL,
    `expected_salary` VARCHAR(30) NOT NULL,
    `rotate_work` VARCHAR(30) NOT NULL,
    `employees_you_know` VARCHAR(30) NOT NULL,
    `relationship_with_the_employee` VARCHAR(30) NOT NULL,
    `ref_mobile_phone` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `assessment_assigned_to` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_onboarding` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `employee_request_id` INTEGER NOT NULL,
    `candidate_recruitment_detail_id` INTEGER NOT NULL,
    `job_placement` VARCHAR(30) NOT NULL,
    `document` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `document_candidate` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_educational_background` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `school_university` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `degree` VARCHAR(30) NOT NULL,
    `major` VARCHAR(30) NOT NULL,
    `year_graduate` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_work_experiences` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `company` VARCHAR(50) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `job_title` VARCHAR(30) NOT NULL,
    `period` VARCHAR(30) NOT NULL,
    `length_of_working` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_family_members` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `relation` VARCHAR(50) NOT NULL,
    `age` INTEGER NOT NULL,
    `education` VARCHAR(30) NOT NULL,
    `work` VARCHAR(30) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidate_recruitment_course_experience` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_id` INTEGER NOT NULL,
    `course_topic` VARCHAR(100) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `year` INTEGER NOT NULL,
    `city` VARCHAR(30) NOT NULL,
    `certificate` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facillities` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `inventory_no` VARCHAR(255) NOT NULL,
    `item` VARCHAR(255) NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `unit` VARCHAR(50) NOT NULL,
    `condition` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `candidate_recruitment_onboarding_id` INTEGER NOT NULL,

    INDEX `facillities_candidate_recruitment_onboarding_id_idx`(`candidate_recruitment_onboarding_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `onboarding_program` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `candidate_recruitment_onboarding_id` INTEGER NOT NULL,
    `program` VARCHAR(255) NOT NULL,
    `date` VARCHAR(50) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `pic` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `onboarding_program_candidate_recruitment_onboarding_id_idx`(`candidate_recruitment_onboarding_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role_access`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee_list`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_files` ADD CONSTRAINT `user_files_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_obs_id_fkey` FOREIGN KEY (`obs_id`) REFERENCES `obs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `departments` ADD CONSTRAINT `departments_division_id_fkey` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_titles` ADD CONSTRAINT `job_titles_job_level_id_fkey` FOREIGN KEY (`job_level_id`) REFERENCES `job_levels`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `job_titles` ADD CONSTRAINT `job_titles_division_id_fkey` FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_titles` ADD CONSTRAINT `job_titles_direct_report_id_fkey` FOREIGN KEY (`direct_report_id`) REFERENCES `job_titles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_job_title` ADD CONSTRAINT `department_job_title_job_title_id_fkey` FOREIGN KEY (`job_title_id`) REFERENCES `job_titles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `department_job_title` ADD CONSTRAINT `department_job_title_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_budget` ADD CONSTRAINT `employee_budget_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_request` ADD CONSTRAINT `employee_request_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_request_comment` ADD CONSTRAINT `employee_request_comment_employee_request_id_fkey` FOREIGN KEY (`employee_request_id`) REFERENCES `employee_request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_request_comment` ADD CONSTRAINT `employee_request_comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

