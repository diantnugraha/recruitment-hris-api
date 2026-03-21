export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET ?? 'default-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '3d'
} as const
