export const DEPARTMENT_ERROR_MESSAGES = {
  NOT_FOUND: 'Department not found',
  NAME_EXISTS: 'Department with this name already exists',
  CODE_EXISTS: 'Department with this code already exists',
  DIVISION_NOT_FOUND: 'Division not found',
  HAS_EMPLOYEES: 'Cannot delete department with existing employees',
  HAS_JOB_TITLES: 'Cannot delete department with existing job titles',
  INVALID_MANAGER: 'Invalid manager employee',
  MANAGER_ALREADY_ASSIGNED: 'This employee is already assigned as manager of another department'
} as const

export const DEPARTMENT_SUCCESS_MESSAGES = {
  CREATED: 'Department created successfully',
  UPDATED: 'Department updated successfully',
  DELETED: 'Department deleted successfully',
  MANAGER_ASSIGNED: 'Manager assigned successfully',
  MANAGER_REMOVED: 'Manager removed successfully'
} as const
