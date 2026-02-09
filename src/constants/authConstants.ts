export const AUTH_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  TOKEN_PREFIX: 'Bearer'
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
