import type { Employee } from '@prisma/client'

/**
 * Employee Transformer
 * Transforms legacy database schema to new API contract format
 */

export type TransformedEmployee = {
  id: string
  employee_id: string
  employee_nik: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  employee_contact: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  hire_date: string | null
  status: string
  department_id: string | null
  division_id: string | null
  job_title_id: string | null
  job_level_id: string | null
  manager_id: string | null
  superior_id: string | null
  photo: string | null
  created_at: string
  updated_at: string
  // Employment details
  employee_type: string | null
  employee_bu: string | null
  employee_ext: string | null
  employee_location: string | null
  fte: number | null
  // Contract & probation dates
  employee_permanentdate: string | null
  employee_contractdate: string | null
  employee_contractenddate: string | null
  employee_probationdate: string | null
  employee_probationenddate: string | null
  // Family
  employee_mother: string | null
  employee_father: string | null
  employee_spouse: string | null
  employee_maritalstatus: string | null
  // Emergency contact
  employee_emg_name: string | null
  employee_emg_rel: string | null
  employee_emg_phone: string | null
  // Additional
  employee_religion: string | null
  employee_ethnic: string | null
  // Relations
  department: {
    id: string
    name: string
    code: string
  } | null
  division: {
    id: string
    name: string
    code: string
  } | null
  job_title: {
    id: string
    name: string
    code: string
  } | null
  job_level: {
    id: string
    name: string
    category: string
  } | null
}

export type DepartmentInfo = {
  id: number
  name: string
  code: string
}

export type JobTitleInfo = {
  id: bigint
  name: string
  departments: DepartmentInfo[]
}

/**
 * Split full name into first and last name
 */
function splitName(fullName: string | null): { first: string; last: string } {
  if (!fullName || fullName.trim() === '') {
    return { first: '', last: '' }
  }

  const parts = fullName.trim().split(' ')

  if (parts.length === 1) {
    return { first: parts[0] || '', last: '' }
  }

  const lastName = parts[parts.length - 1] || ''
  const firstName = parts.slice(0, -1).join(' ') || ''

  return { first: firstName, last: lastName }
}

/**
 * Map legacy employeeStatus to new status values
 */
function mapStatus(legacyStatus: string | null): string {
  if (!legacyStatus) return 'inactive'

  const statusMap: Record<string, string> = {
    // English
    'active': 'active',
    'inactive': 'inactive',
    'resigned': 'terminated',
    'terminated': 'terminated',
    'on_leave': 'on_leave',
    'leave': 'on_leave',
    // Indonesian
    'aktif': 'active',
    'tidak aktif': 'inactive',
    'non aktif': 'inactive',
    'nonaktif': 'inactive',
    'cuti': 'on_leave',
    'kontrak': 'contract',
    'pkwt': 'contract',
    'pkwtt': 'permanent',
    'tetap': 'permanent',
    'resign': 'terminated',
    'berhenti': 'terminated',
  }

  // Return mapped value, or pass through the original lowercase value as-is
  return statusMap[legacyStatus.trim().toLowerCase()] ?? legacyStatus.trim().toLowerCase()
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null
  const formatted = date.toISOString().split('T')[0]
  return formatted || null
}

/**
 * Transform legacy Employee to new API format.
 * @param employee - Raw Prisma Employee record
 * @param titleToDeptMap - Lookup map: lowercase job title name → DepartmentInfo
 */
export function transformEmployee(
  employee: Employee,
  titleToDeptMap: Map<string, DepartmentInfo> = new Map()
): TransformedEmployee {
  const { first, last } = splitName(employee.employeeName)
  const status = mapStatus(employee.employeeStatus)
  const formattedHireDate = formatDate(employee.employeeJoindate)

  // Resolve department from job title via lookup map
  const titleKey = employee.employeeTitle?.trim().toLowerCase() ?? ''
  const resolvedDept = titleToDeptMap.get(titleKey) ?? null

  // Fallback IDs for division & job_title (still from legacy string fields)
  const divisionId: string | null = employee.employeeLocation
    ? `div-${employee.employeeLocation.toLowerCase().replace(/\s+/g, '-')}`
    : null
  const jobTitleId: string | null = employee.employeeTitle
    ? `jt-${employee.employeeTitle.toLowerCase().replace(/\s+/g, '-')}`
    : null

  return {
    id: employee.uuid !== null ? employee.uuid : employee.employeeId.toString(),
    employee_id: employee.employeeId.toString(),
    employee_nik: employee.employeeNik ?? null,
    first_name: first,
    last_name: last,
    email: employee.employeeEmail ?? null,
    phone: employee.employeeContact ?? null,
    employee_contact: employee.employeeContact ?? null,
    date_of_birth: formatDate(employee.employeeBirthdate),
    gender: employee.employeeGender ?? null,
    address: null,
    hire_date: formattedHireDate,
    status,
    department_id: resolvedDept ? resolvedDept.id.toString() : null,
    division_id: divisionId,
    job_title_id: jobTitleId,
    job_level_id: null,
    manager_id: employee.superiorId?.toString() ?? null,
    superior_id: employee.superiorId?.toString() ?? null,
    photo: employee.employeeImages ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Employment details
    employee_type: null,
    employee_bu: employee.employeeBu ?? null,
    employee_ext: employee.employeeExt ?? null,
    employee_location: employee.employeeLocation ?? null,
    fte: null,

    // Contract & probation dates
    employee_permanentdate: formatDate(employee.employeePermanentdate),
    employee_contractdate: null,
    employee_contractenddate: null,
    employee_probationdate: null,
    employee_probationenddate: null,

    // Family
    employee_mother: employee.employeeMother ?? null,
    employee_father: employee.employeeFather ?? null,
    employee_spouse: employee.employeeSpouse ?? null,
    employee_maritalstatus: employee.employeeMaritalstatus ?? null,

    // Emergency contact
    employee_emg_name: employee.employeeEmgName ?? null,
    employee_emg_rel: employee.employeeEmgRel ?? null,
    employee_emg_phone: employee.employeeEmgPhone ?? null,

    // Additional
    employee_religion: employee.employeeReligion ?? null,
    employee_ethnic: employee.employeeEthnic ?? null,

    // Department resolved from job_title → department_job_title → departments
    department: resolvedDept
      ? { id: resolvedDept.id.toString(), name: resolvedDept.name, code: resolvedDept.code }
      : null,

    division: employee.employeeLocation
      ? {
          id: divisionId!,
          name: employee.employeeLocation,
          code: employee.employeeLocation.substring(0, 3).toUpperCase()
        }
      : null,

    job_title: employee.employeeTitle
      ? {
          id: jobTitleId!,
          name: employee.employeeTitle,
          code: employee.employeeTitle.substring(0, 3).toUpperCase()
        }
      : null,

    job_level: null
  }
}

/**
 * Transform array of employees
 */
export function transformEmployees(
  employees: Employee[],
  titleToDeptMap: Map<string, DepartmentInfo> = new Map()
): TransformedEmployee[] {
  return employees.map((emp) => transformEmployee(emp, titleToDeptMap))
}
