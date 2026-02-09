export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  CONFLICT: 'Resource already exists'
} as const

export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES]
