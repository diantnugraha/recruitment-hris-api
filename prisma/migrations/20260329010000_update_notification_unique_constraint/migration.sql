-- Drop existing unique constraint that doesn't include user_id
DROP INDEX `uq_notification_ref_type` ON `notification`;

-- Create new unique constraint including user_id (allows multiple users to receive same notification type for same reference)
CREATE UNIQUE INDEX `uq_notification_ref_type_user` ON `notification` (`reference_type`, `reference_id`, `type`, `user_id`);

-- Increase type column size to accommodate longer notification type strings
ALTER TABLE `notification` MODIFY COLUMN `type` VARCHAR(50) NOT NULL;
