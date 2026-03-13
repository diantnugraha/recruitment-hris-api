export const OBS_ERROR_MESSAGES = {
  NOT_FOUND: 'OBS (Business Unit) not found',
  NAME_EXISTS: 'OBS with this name already exists',
  CODE_EXISTS: 'OBS with this code already exists',
  HAS_DIVISIONS: 'Cannot delete OBS with existing divisions'
} as const

export const OBS_SUCCESS_MESSAGES = {
  CREATED: 'OBS created successfully',
  UPDATED: 'OBS updated successfully',
  DELETED: 'OBS deleted successfully'
} as const
