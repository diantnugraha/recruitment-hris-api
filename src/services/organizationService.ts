import { prisma } from '../config/database.js'
import { NotFoundError } from '../errors/index.js'
import { getStructuralAction } from '../constants/jobLevelConstants.js'

/**
 * Employee with user info for notification purposes
 */
export type EmployeeWithUser = {
  employeeId: number
  employeeName: string | null
  employeeEmail: string | null
  user: {
    id: number
    email: string
    displayName: string
  } | null
}

/**
 * Division head info for notification purposes
 */
export type DivisionHeadInfo = {
  divisionId: number
  divisionName: string
  isManagement: boolean
  headOfDivision: EmployeeWithUser | null
  deputyHead: EmployeeWithUser | null
}

/**
 * Department manager info for notification purposes
 */
export type DepartmentManagerInfo = {
  departmentId: number
  departmentName: string
  divisionId: number | null
  divisionName: string | null
  manager: EmployeeWithUser | null
}

/**
 * Employee's organizational hierarchy
 */
export type EmployeeOrganizationChain = {
  employee: {
    employeeId: number
    employeeName: string | null
    employeeEmail: string | null
    jobTitle: { id: bigint; name: string } | null
  }
  department: {
    id: number
    name: string
    manager: EmployeeWithUser | null
  } | null
  division: {
    id: number
    name: string
    isManagement: boolean
    headOfDivision: EmployeeWithUser | null
    deputyHead: EmployeeWithUser | null
  } | null
  obs: {
    id: bigint
    name: string
  } | null
}

const employeeWithUserSelect = {
  employeeId: true,
  employeeName: true,
  employeeEmail: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true
    }
  }
} as const

/**
 * Get Head of Division by division ID
 */
export async function getHeadOfDivision(divisionId: number): Promise<EmployeeWithUser | null> {
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: {
      headOfDivision: { select: employeeWithUserSelect }
    }
  })

  if (!division) {
    throw new NotFoundError('Division not found')
  }

  return division.headOfDivision
}

/**
 * Get Deputy Head of Division by division ID
 */
export async function getDeputyHead(divisionId: number): Promise<EmployeeWithUser | null> {
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: {
      deputyHead: { select: employeeWithUserSelect }
    }
  })

  if (!division) {
    throw new NotFoundError('Division not found')
  }

  return division.deputyHead
}

/**
 * Get all Division Heads (for broadcast email)
 * Optionally filter by management/operational divisions
 */
export async function getAllDivisionHeads(
  options?: { isManagement?: boolean }
): Promise<DivisionHeadInfo[]> {
  const where = options?.isManagement !== undefined
    ? { isManagement: options.isManagement }
    : {}

  const divisions = await prisma.division.findMany({
    where,
    select: {
      id: true,
      name: true,
      isManagement: true,
      headOfDivision: { select: employeeWithUserSelect },
      deputyHead: { select: employeeWithUserSelect }
    },
    orderBy: { name: 'asc' }
  })

  return divisions.map(d => ({
    divisionId: d.id,
    divisionName: d.name,
    isManagement: d.isManagement,
    headOfDivision: d.headOfDivision,
    deputyHead: d.deputyHead
  }))
}

/**
 * Get all Division Heads with email (for sending notifications)
 */
export async function getDivisionHeadEmails(
  options?: { isManagement?: boolean }
): Promise<Array<{ email: string; name: string; divisionName: string }>> {
  const heads = await getAllDivisionHeads(options)

  return heads
    .filter(h => h.headOfDivision?.user?.email)
    .map(h => ({
      email: h.headOfDivision!.user!.email,
      name: h.headOfDivision!.user!.displayName || h.headOfDivision!.employeeName || '',
      divisionName: h.divisionName
    }))
}

/**
 * Get Department Manager by department ID
 */
export async function getDepartmentManager(departmentId: number): Promise<EmployeeWithUser | null> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      manager: { select: employeeWithUserSelect }
    }
  })

  if (!department) {
    throw new NotFoundError('Department not found')
  }

  return department.manager
}

/**
 * Get all Department Managers (for broadcast email)
 * Optionally filter by division
 */
export async function getAllDepartmentManagers(
  options?: { divisionId?: number }
): Promise<DepartmentManagerInfo[]> {
  const where = options?.divisionId
    ? { divisionId: options.divisionId }
    : {}

  const departments = await prisma.department.findMany({
    where,
    select: {
      id: true,
      name: true,
      divisionId: true,
      division: { select: { name: true } },
      manager: { select: employeeWithUserSelect }
    },
    orderBy: { name: 'asc' }
  })

  return departments.map(d => ({
    departmentId: d.id,
    departmentName: d.name,
    divisionId: d.divisionId,
    divisionName: d.division?.name ?? null,
    manager: d.manager
  }))
}

/**
 * Get Employee's full organizational hierarchy chain
 * Useful for approval workflows and understanding reporting structure
 */
export async function getEmployeeOrganizationChain(
  employeeId: number
): Promise<EmployeeOrganizationChain> {
  const employee = await prisma.employee.findUnique({
    where: { employeeId },
    select: {
      employeeId: true,
      employeeName: true,
      employeeEmail: true,
      jobTitle: { select: { id: true, name: true } },
      department: {
        select: {
          id: true,
          name: true,
          manager: { select: employeeWithUserSelect },
          division: {
            select: {
              id: true,
              name: true,
              isManagement: true,
              headOfDivision: { select: employeeWithUserSelect },
              deputyHead: { select: employeeWithUserSelect },
              obs: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  })

  if (!employee) {
    throw new NotFoundError('Employee not found')
  }

  return {
    employee: {
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      employeeEmail: employee.employeeEmail,
      jobTitle: employee.jobTitle
    },
    department: employee.department
      ? {
          id: employee.department.id,
          name: employee.department.name,
          manager: employee.department.manager
        }
      : null,
    division: employee.department?.division
      ? {
          id: employee.department.division.id,
          name: employee.department.division.name,
          isManagement: employee.department.division.isManagement,
          headOfDivision: employee.department.division.headOfDivision,
          deputyHead: employee.department.division.deputyHead
        }
      : null,
    obs: employee.department?.division?.obs ?? null
  }
}

/**
 * Get all employees in a division (direct and through departments)
 */
export async function getEmployeesByDivision(
  divisionId: number
): Promise<EmployeeWithUser[]> {
  const employees = await prisma.employee.findMany({
    where: {
      department: { divisionId }
    },
    select: employeeWithUserSelect,
    orderBy: { employeeName: 'asc' }
  })

  return employees
}

/**
 * Get all employees in a department
 */
export async function getEmployeesByDepartment(
  departmentId: number
): Promise<EmployeeWithUser[]> {
  const employees = await prisma.employee.findMany({
    where: { departmentId },
    select: employeeWithUserSelect,
    orderBy: { employeeName: 'asc' }
  })

  return employees
}

/**
 * Check if an employee is a head of any division
 */
export async function isEmployeeHeadOfDivision(employeeId: number): Promise<boolean> {
  const count = await prisma.division.count({
    where: { headOfDivisionId: employeeId }
  })
  return count > 0
}

/**
 * Check if an employee is a manager of any department
 */
export async function isEmployeeDepartmentManager(employeeId: number): Promise<boolean> {
  const count = await prisma.department.count({
    where: { managerId: employeeId }
  })
  return count > 0
}

/**
 * Get structural positions held by an employee
 */
export async function getEmployeeStructuralPositions(
  employeeId: number
): Promise<{
  headOfDivisions: Array<{ id: number; name: string }>
  deputyOfDivisions: Array<{ id: number; name: string }>
  managedDepartments: Array<{ id: number; name: string }>
}> {
  const [headOfDivisions, deputyOfDivisions, managedDepartments] = await prisma.$transaction([
    prisma.division.findMany({
      where: { headOfDivisionId: employeeId },
      select: { id: true, name: true }
    }),
    prisma.division.findMany({
      where: { deputyHeadId: employeeId },
      select: { id: true, name: true }
    }),
    prisma.department.findMany({
      where: { managerId: employeeId },
      select: { id: true, name: true }
    })
  ])

  return {
    headOfDivisions,
    deputyOfDivisions,
    managedDepartments
  }
}

/**
 * Auto-fill structural position based on job title
 * Called when employee is created/updated with a job title
 *
 * @param employeeId - The employee being assigned
 * @param jobTitleName - The job title name (from employeeTitle field)
 * @param departmentId - Optional: specific department ID (for MANAGER when multiple departments)
 */
export async function updateStructuralPosition(
  employeeId: number,
  jobTitleName: string | null | undefined,
  departmentId?: number | null
): Promise<void> {
  if (!jobTitleName) return

  // Find job title with job level code
  const jobTitle = await prisma.jobTitle.findFirst({
    where: { name: jobTitleName },
    select: {
      id: true,
      divisionId: true,
      jobLevel: {
        select: { code: true }
      },
      departments: {
        select: {
          department: {
            select: { id: true }
          }
        }
      }
    }
  })

  if (!jobTitle?.jobLevel?.code) return

  const action = getStructuralAction(jobTitle.jobLevel.code)

  if (action === 'UPDATE_DIVISION_HEAD' && jobTitle.divisionId) {
    // Update division's head_of_division_id
    await prisma.division.update({
      where: { id: jobTitle.divisionId },
      data: { headOfDivisionId: employeeId }
    })
  } else if (action === 'UPDATE_DEPARTMENT_MANAGER') {
    // Use provided departmentId or fall back to first linked department
    const targetDeptId = departmentId ?? jobTitle.departments[0]?.department?.id
    if (targetDeptId) {
      await prisma.department.update({
        where: { id: targetDeptId },
        data: { managerId: employeeId }
      })
    }
  }
}

/**
 * Clear structural position when employee changes job title
 * Called before assigning new job title to clear old structural positions
 *
 * @param employeeId - The employee being reassigned
 */
export async function clearStructuralPositions(employeeId: number): Promise<void> {
  await prisma.$transaction([
    // Clear head_of_division_id
    prisma.division.updateMany({
      where: { headOfDivisionId: employeeId },
      data: { headOfDivisionId: null }
    }),
    // Clear manager_id
    prisma.department.updateMany({
      where: { managerId: employeeId },
      data: { managerId: null }
    })
  ])
}

/**
 * Check if structural position is currently occupied by another employee
 * Returns the current holder's info if position is occupied
 */
export type StructuralPositionCheck = {
  isOccupied: boolean
  positionType: 'HEAD_OF_DIVISION' | 'MANAGER' | null
  currentHolder: {
    employeeId: number
    employeeName: string | null
  } | null
  targetName: string | null // Division or Department name
}

export async function checkStructuralPositionOccupied(
  jobTitleName: string,
  departmentId?: number | null
): Promise<StructuralPositionCheck> {
  // Find job title with job level code
  const jobTitle = await prisma.jobTitle.findFirst({
    where: { name: jobTitleName },
    select: {
      divisionId: true,
      jobLevel: {
        select: { code: true }
      },
      departments: {
        select: {
          department: {
            select: { id: true }
          }
        }
      }
    }
  })

  if (!jobTitle?.jobLevel?.code) {
    return { isOccupied: false, positionType: null, currentHolder: null, targetName: null }
  }

  const action = getStructuralAction(jobTitle.jobLevel.code)

  if (action === 'UPDATE_DIVISION_HEAD' && jobTitle.divisionId) {
    const division = await prisma.division.findUnique({
      where: { id: jobTitle.divisionId },
      select: {
        name: true,
        headOfDivisionId: true,
        headOfDivision: {
          select: {
            employeeId: true,
            employeeName: true
          }
        }
      }
    })

    if (division?.headOfDivisionId && division.headOfDivision) {
      return {
        isOccupied: true,
        positionType: 'HEAD_OF_DIVISION',
        currentHolder: {
          employeeId: division.headOfDivision.employeeId,
          employeeName: division.headOfDivision.employeeName
        },
        targetName: division.name
      }
    }
  } else if (action === 'UPDATE_DEPARTMENT_MANAGER') {
    const targetDeptId = departmentId ?? jobTitle.departments[0]?.department?.id
    if (targetDeptId) {
      const department = await prisma.department.findUnique({
        where: { id: targetDeptId },
        select: {
          name: true,
          managerId: true,
          manager: {
            select: {
              employeeId: true,
              employeeName: true
            }
          }
        }
      })

      if (department?.managerId && department.manager) {
        return {
          isOccupied: true,
          positionType: 'MANAGER',
          currentHolder: {
            employeeId: department.manager.employeeId,
            employeeName: department.manager.employeeName
          },
          targetName: department.name
        }
      }
    }
  }

  return { isOccupied: false, positionType: null, currentHolder: null, targetName: null }
}
