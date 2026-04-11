-- Create notification table
CREATE TABLE `notification` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `reference_type` VARCHAR(50) NULL,
  `reference_id` BIGINT UNSIGNED NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  INDEX `idx_notification_user_id` (`user_id`),
  INDEX `idx_notification_user_read` (`user_id`, `is_read`),
  INDEX `idx_notification_ref_type` (`reference_type`, `reference_id`, `type`),
  UNIQUE INDEX `uq_notification_ref_type` (`reference_type`, `reference_id`, `type`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
