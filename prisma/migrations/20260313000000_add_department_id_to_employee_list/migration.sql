-- Add department_id column to employee_list table
ALTER TABLE `employee_list` ADD COLUMN `department_id` INT NULL;

-- Create index for department_id
CREATE INDEX `employee_list_department_id_idx` ON `employee_list`(`department_id`);
