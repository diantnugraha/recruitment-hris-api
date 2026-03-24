-- AlterTable: make birth_date nullable
ALTER TABLE `candidate_recruitment` MODIFY `birth_date` DATE NULL;

-- Set existing default/today dates to NULL for candidates who haven't filled biodata
UPDATE `candidate_recruitment` SET `birth_date` = NULL WHERE `birth_date` = CURDATE();
