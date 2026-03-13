export const DIVISION_TYPE = {
  MANAGEMENT: true,
  OPERATIONAL: false
} as const

export const DIVISION_ERROR_MESSAGES = {
  NOT_FOUND: 'Division not found',
  NAME_EXISTS: 'Division with this name already exists',
  CODE_EXISTS: 'Division with this code already exists',
  HAS_DEPARTMENTS: 'Cannot delete division with existing departments',
  INVALID_HEAD: 'Invalid head of division employee',
  INVALID_DEPUTY: 'Invalid deputy head employee',
  HEAD_ALREADY_ASSIGNED: 'This employee is already assigned as head of another division',
  DEPUTY_ALREADY_ASSIGNED: 'This employee is already assigned as deputy of another division'
} as const

export const DIVISION_SUCCESS_MESSAGES = {
  CREATED: 'Division created successfully',
  UPDATED: 'Division updated successfully',
  DELETED: 'Division deleted successfully',
  HEAD_ASSIGNED: 'Head of division assigned successfully',
  DEPUTY_ASSIGNED: 'Deputy head assigned successfully'
} as const
