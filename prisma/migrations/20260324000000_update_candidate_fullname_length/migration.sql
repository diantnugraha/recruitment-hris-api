-- Temporarily disable strict mode to handle invalid date values
SET @old_sql_mode = @@sql_mode;
SET sql_mode = '';

-- Fix invalid birth_date values before altering table
UPDATE `candidate_recruitment` SET `birth_date` = NULL WHERE `birth_date` = '0000-00-00';

-- AlterTable
ALTER TABLE `candidate_recruitment` MODIFY `fullname` VARCHAR(255) NOT NULL;

-- Restore strict mode
SET sql_mode = @old_sql_mode;
