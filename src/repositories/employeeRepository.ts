import type { Employee, Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

export type EmployeeFilters = {
  name?: string
  email?: string
  status?: string
  gender?: string
  location?: string
  businessUnit?: string
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: Employee[]
  total: number
}

export type CreateEmployeeData = {
  name: string
  nickname?: string
  email?: string
  contact?: string
  gender?: string
  status?: string
  title?: string
  departmentId?: number
  location?: string
  businessUnit?: string
  extension?: string
  joinDate?: Date
  birthDate?: Date
  permanentDate?: Date
  superiorId?: number
  maritalStatus?: string
  nik?: string
  address?: string
  religion?: string
  ethnic?: string
  motherName?: string
  fatherName?: string
  spouseName?: string
  emergencyName?: string
  emergencyRelation?: string
  emergencyPhone?: string
}

export type UpdateEmployeeData = {
  name?: string
  nickname?: string
  email?: string
  contact?: string
  gender?: string
  status?: string
  title?: string
  departmentId?: number | null
  location?: string
  businessUnit?: string
  extension?: string
  joinDate?: Date
  birthDate?: Date
  permanentDate?: Date
  superiorId?: number | null
  maritalStatus?: string
  nik?: string
  address?: string
  religion?: string
  ethnic?: string
  motherName?: string
  fatherName?: string
  spouseName?: string
  emergencyName?: string
  emergencyRelation?: string
  emergencyPhone?: string
}

const ACTIVE_FILTER: Prisma.EmployeeWhereInput = {
  OR: [
    { employeeTrash: null },
    { employeeTrash: 0 }
  ]
}

export async function findAll(
  filters: EmployeeFilters,
  pagination: PaginationParams
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const where: Prisma.EmployeeWhereInput = {
      ...ACTIVE_FILTER,
      ...(filters.name && { employeeName: { contains: filters.name } }),
      ...(filters.email && { employeeEmail: { contains: filters.email } }),
      ...(filters.status && { employeeStatus: filters.status }),
      ...(filters.gender && { employeeGender: filters.gender }),
      ...(filters.location && { employeeLocation: { contains: filters.location } }),
      ...(filters.businessUnit && { employeeBu: { contains: filters.businessUnit } })
    }

    const [items, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        orderBy: { employeeName: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.employee.count({ where })
    ])

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch employees'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<Employee | null>> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        employeeId: id,
        ...ACTIVE_FILTER
      }
    })
    return success(employee)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find employee by id'
    return failure(message)
  }
}

export async function findByUuid(uuid: string): Promise<RepositoryResult<Employee | null>> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        uuid,
        ...ACTIVE_FILTER
      }
    })
    return success(employee)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find employee by uuid'
    return failure(message)
  }
}

export async function create(data: CreateEmployeeData): Promise<RepositoryResult<Employee>> {
  try {
    const createData: Prisma.EmployeeCreateInput = {
      uuid: randomUUID(),
      employeeName: data.name
    }

    if (data.nickname !== undefined) createData.employeeNickname = data.nickname
    if (data.email !== undefined) createData.employeeEmail = data.email
    if (data.contact !== undefined) createData.employeeContact = data.contact
    if (data.gender !== undefined) createData.employeeGender = data.gender
    if (data.status !== undefined) createData.employeeStatus = data.status
    if (data.title !== undefined) createData.employeeTitle = data.title
    if (data.departmentId !== undefined) createData.departmentId = data.departmentId
    if (data.location !== undefined) createData.employeeLocation = data.location
    if (data.businessUnit !== undefined) createData.employeeBu = data.businessUnit
    if (data.extension !== undefined) createData.employeeExt = data.extension
    if (data.joinDate !== undefined) createData.employeeJoindate = data.joinDate
    if (data.birthDate !== undefined) createData.employeeBirthdate = data.birthDate
    if (data.permanentDate !== undefined) createData.employeePermanentdate = data.permanentDate
    if (data.superiorId !== undefined) createData.superiorId = data.superiorId
    if (data.nik !== undefined) createData.employeeNik = data.nik
    if (data.maritalStatus !== undefined) createData.employeeMaritalstatus = data.maritalStatus
    if (data.address !== undefined) createData.employeeAddress = data.address
    if (data.religion !== undefined) createData.employeeReligion = data.religion
    if (data.ethnic !== undefined) createData.employeeEthnic = data.ethnic
    if (data.motherName !== undefined) createData.employeeMother = data.motherName
    if (data.fatherName !== undefined) createData.employeeFather = data.fatherName
    if (data.spouseName !== undefined) createData.employeeSpouse = data.spouseName
    if (data.emergencyName !== undefined) createData.employeeEmgName = data.emergencyName
    if (data.emergencyRelation !== undefined) createData.employeeEmgRel = data.emergencyRelation
    if (data.emergencyPhone !== undefined) createData.employeeEmgPhone = data.emergencyPhone

    const employee = await prisma.employee.create({ data: createData })
    return success(employee)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create employee'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateEmployeeData): Promise<RepositoryResult<Employee>> {
  try {
    const updateData: Prisma.EmployeeUpdateInput = {}

    if (data.name !== undefined) updateData.employeeName = data.name
    if (data.nickname !== undefined) updateData.employeeNickname = data.nickname
    if (data.email !== undefined) updateData.employeeEmail = data.email
    if (data.contact !== undefined) updateData.employeeContact = data.contact
    if (data.gender !== undefined) updateData.employeeGender = data.gender
    if (data.status !== undefined) updateData.employeeStatus = data.status
    if (data.title !== undefined) updateData.employeeTitle = data.title
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId
    if (data.location !== undefined) updateData.employeeLocation = data.location
    if (data.businessUnit !== undefined) updateData.employeeBu = data.businessUnit
    if (data.extension !== undefined) updateData.employeeExt = data.extension
    if (data.joinDate !== undefined) updateData.employeeJoindate = data.joinDate
    if (data.birthDate !== undefined) updateData.employeeBirthdate = data.birthDate
    if (data.permanentDate !== undefined) updateData.employeePermanentdate = data.permanentDate
    if (data.superiorId !== undefined) updateData.superiorId = data.superiorId
    if (data.nik !== undefined) updateData.employeeNik = data.nik
    if (data.maritalStatus !== undefined) updateData.employeeMaritalstatus = data.maritalStatus
    if (data.address !== undefined) updateData.employeeAddress = data.address
    if (data.religion !== undefined) updateData.employeeReligion = data.religion
    if (data.ethnic !== undefined) updateData.employeeEthnic = data.ethnic
    if (data.motherName !== undefined) updateData.employeeMother = data.motherName
    if (data.fatherName !== undefined) updateData.employeeFather = data.fatherName
    if (data.spouseName !== undefined) updateData.employeeSpouse = data.spouseName
    if (data.emergencyName !== undefined) updateData.employeeEmgName = data.emergencyName
    if (data.emergencyRelation !== undefined) updateData.employeeEmgRel = data.emergencyRelation
    if (data.emergencyPhone !== undefined) updateData.employeeEmgPhone = data.emergencyPhone

    const employee = await prisma.employee.update({
      where: { employeeId: id },
      data: updateData
    })
    return success(employee)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update employee'
    return failure(message)
  }
}

export async function softDelete(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.employee.update({
      where: { employeeId: id },
      data: { employeeTrash: 1 }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete employee'
    return failure(message)
  }
}

export async function emailExists(email: string): Promise<RepositoryResult<boolean>> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        employeeEmail: email,
        ...ACTIVE_FILTER
      },
      select: { employeeId: true }
    })
    return success(employee !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check email existence'
    return failure(message)
  }
}

export async function emailExistsExcept(email: string, exceptId: number): Promise<RepositoryResult<boolean>> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        employeeEmail: email,
        employeeId: { not: exceptId },
        ...ACTIVE_FILTER
      },
      select: { employeeId: true }
    })
    return success(employee !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check email existence'
    return failure(message)
  }
}

export async function superiorExists(id: number): Promise<RepositoryResult<boolean>> {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        employeeId: id,
        ...ACTIVE_FILTER
      },
      select: { employeeId: true }
    })
    return success(employee !== null)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check superior existence'
    return failure(message)
  }
}

export async function hasUsers(id: number): Promise<RepositoryResult<boolean>> {
  try {
    const count = await prisma.user.count({
      where: {
        employeeId: id,
        trash: null
      }
    })
    return success(count > 0)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check users'
    return failure(message)
  }
}
