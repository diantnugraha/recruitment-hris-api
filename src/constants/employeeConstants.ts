export const EMPLOYEE_STATUS = {
  PROBATION: 'Probation',
  CONTRACT: 'Contract',
  PERMANENT: 'Permanent',
  RESIGNED: 'Resigned'
} as const

export type EmployeeStatus = typeof EMPLOYEE_STATUS[keyof typeof EMPLOYEE_STATUS]

export const EMPLOYEE_GENDER = {
  ANY: 'Any',
  MALE: 'Male',
  FEMALE: 'Female'
} as const

export type EmployeeGender = typeof EMPLOYEE_GENDER[keyof typeof EMPLOYEE_GENDER]

export const EMPLOYEE_MARITAL_STATUS = {
  SINGLE: 'Single',
  MARRIED: 'Married',
  DIVORCED: 'Divorced',
  WIDOWED: 'Widowed'
} as const

export type EmployeeMaritalStatus = typeof EMPLOYEE_MARITAL_STATUS[keyof typeof EMPLOYEE_MARITAL_STATUS]
