// Normalized role shorthand used in WORKFLOW_TRANSITIONS and authorization checks.
// Keys are the exact role_access.role_name values from the database.
// Values are the shorthand strings used internally.
export const ROLE_NAME_MAP: Record<string, string> = {
  'admin': 'admin',
  'Administrator': 'admin',
  'Human Resources': 'hr_staff',
  'HR Manager': 'hr',
  'Management': 'management',
  'Head Of Division': 'hod',
  'PC Head/Manager': 'manager',
}

// Reverse: shorthand → display name (for UI if needed)
export const ROLE_SHORTHAND = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGEMENT: 'management',
  MANAGER: 'manager',
  HOD: 'hod',
} as const

export type RoleShorthand = typeof ROLE_SHORTHAND[keyof typeof ROLE_SHORTHAND]

/**
 * Normalize a role_access.role_name to shorthand.
 * Returns the raw roleName lowercased if no mapping exists.
 */
export function normalizeRoleName(roleName: string): string {
  return ROLE_NAME_MAP[roleName] ?? roleName.toLowerCase()
}
