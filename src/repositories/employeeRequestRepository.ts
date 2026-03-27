import type { EmployeeRequest, EmployeeRequestComment, Prisma } from '@prisma/client'

import { prisma } from '../config/database.js'
import { type RepositoryResult, success, failure } from './types.js'

// Status mapping: DB uses Int (0-8), API uses string
export const STATUS_MAP: Record<number, string> = {
  0: 'draft',
  1: 'created',           // Waiting for HOD Review
  8: 'hod_reviewed',      // HOD Reviewed, waiting for HR Review
  2: 'reviewed',          // HR Reviewed, waiting for Management Approval
  3: 'approved',
  4: 'rejected',
  5: 'revise',
  6: 'in_recruitment',
  7: 'completed',
}

export const STATUS_REVERSE_MAP: Record<string, number> = {
  draft: 0,
  created: 1,
  hod_reviewed: 8,
  reviewed: 2,
  approved: 3,
  rejected: 4,
  revise: 5,
  in_recruitment: 6,
  completed: 7,
}

// Gender mapping: DB uses enum (M/F/A), API uses string
export const GENDER_MAP: Record<string, string> = {
  M: 'male',
  F: 'female',
  A: 'any',
}

export const GENDER_REVERSE_MAP: Record<string, string> = {
  male: 'M',
  female: 'F',
  any: 'A',
}

export type EmployeeRequestFilters = {
  status?: string
  departmentId?: number
  jobTitleId?: number
  requestedById?: number
  search?: string
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult = {
  items: EmployeeRequestWithRelations[]
  total: number
}

export type EmployeeRequestWithRelations = EmployeeRequest & {
  jobTitle?: { id: bigint; name: string } | null
  department?: { id: number; name: string; code: string } | null
  createdByUser?: { id: number; name: string | null; email: string; displayName: string } | null
  comments?: (EmployeeRequestComment & {
    user?: { id: number; name: string | null; displayName: string; role?: { roleName: string | null } | null } | null
  })[]
}

export type CreateEmployeeRequestData = {
  jobTitleId: number
  reason: string
  purpose: string
  generalJobPurpose?: string
  jobDescription?: string
  jobRequirement?: string
  education: string
  experience: string
  genderPreference: string
  ageMin?: number
  ageMax?: number
  jobPlacement?: string
  budget?: string
  expectedOnboardDate?: Date
  status?: string
  createdBy: number
}

export type UpdateEmployeeRequestData = {
  jobTitleId?: number
  reason?: string
  purpose?: string
  generalJobPurpose?: string
  jobDescription?: string
  jobRequirement?: string
  education?: string
  experience?: string
  genderPreference?: string
  ageMin?: number
  ageMax?: number
  jobPlacement?: string
  budget?: string
  expectedOnboardDate?: Date
  statusEmployeeRequest?: number
  statusRecruitment?: number
  codeRecruitment?: string
  approvedAt?: Date
  departmentId?: number | null
  hodReviewedBy?: number | null
  hodReviewedAt?: Date | null
  hrReviewedBy?: number | null
  hrReviewedAt?: Date | null
  approvedBy?: number | null
  revisedBy?: number | null
  revisedAt?: Date | null
  rejectedBy?: number | null
  rejectedAt?: Date | null
  recruitmentStartedAt?: Date | null
}

export interface RoleFilter {
  roleName: string
  userId: number
  managedDepartmentIds: number[]
  hodDivisionIds: number[]
}

// Only include createdByUser - jobTitle and comments need manual lookups due to type mismatches
const includeRelations = {
  createdByUser: {
    select: { id: true, name: true, email: true, displayName: true }
  }
}

// Helper to fetch job title by ID (separate query due to Int vs BigInt mismatch)
async function fetchJobTitle(jobTitleId: number): Promise<{ id: bigint; name: string } | null> {
  const jobTitle = await prisma.jobTitle.findUnique({
    where: { id: BigInt(jobTitleId) },
    select: { id: true, name: true }
  })
  return jobTitle
}

// Helper to fetch the first department associated with a job title via pivot table
async function fetchDepartmentByJobTitle(jobTitleId: number): Promise<{ id: number; name: string; code: string } | null> {
  const pivot = await prisma.departmentJobTitle.findFirst({
    where: { jobTitleId: BigInt(jobTitleId) },
    include: {
      department: {
        select: { id: true, name: true, code: true }
      }
    }
  })
  return pivot?.department ?? null
}

// Helper to fetch comments for an employee request
async function fetchComments(employeeRequestId: number): Promise<(EmployeeRequestComment & { user?: { id: number; name: string | null; displayName: string; role?: { roleName: string | null } | null } | null })[]> {
  const comments = await prisma.employeeRequestComment.findMany({
    where: { employeeRequestId },
    include: {
      user: {
        select: { id: true, name: true, displayName: true, role: { select: { roleName: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return comments
}

// Generate unique code for employee request
// Format: EY.26020400001 (EY.YYMMDD0001)
async function generateCode(): Promise<string> {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2) // 2-digit year
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const prefix = `EY.${year}${month}${day}`

  // Find the highest existing code for this day
  const lastRequest = await prisma.employeeRequest.findFirst({
    where: {
      code: { startsWith: prefix },
      isDeleted: 0
    },
    orderBy: { code: 'desc' }
  })

  let sequence = 1
  if (lastRequest) {
    // Extract last 4 digits as sequence number
    const lastSequence = parseInt(lastRequest.code.slice(-4) || '0', 10)
    sequence = lastSequence + 1
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`
}

function buildRoleWhereClause(roleFilter: RoleFilter): Record<string, unknown> {
  const { roleName, userId, hodDivisionIds } = roleFilter

  if (roleName === 'admin') return {}

  if (roleName === 'manager') {
    return { createdBy: userId }
  }

  if (roleName === 'hod') {
    return {
      OR: [
        { createdBy: userId },
        ...(hodDivisionIds.length > 0
          ? [{ department: { divisionId: { in: hodDivisionIds } } }]
          : []),
      ],
    }
  }

  if (roleName === 'hr') {
    return {
      OR: [
        { createdBy: userId },
        { statusEmployeeRequest: { in: [1, 8, 2, 3, 4, 5, 6, 7] } },
      ],
    }
  }

  if (roleName === 'management') {
    return {
      OR: [
        { createdBy: userId },
        { statusEmployeeRequest: { in: [2, 3, 4, 5, 6, 7] } },
      ],
    }
  }

  return { createdBy: userId }
}

export async function findAll(
  filters: EmployeeRequestFilters,
  pagination: PaginationParams,
  roleFilter?: RoleFilter
): Promise<RepositoryResult<PaginatedResult>> {
  try {
    const roleWhere = roleFilter ? buildRoleWhereClause(roleFilter) : {}

    const where: Prisma.EmployeeRequestWhereInput = {
      isDeleted: 0,
      ...(filters.status && { statusEmployeeRequest: STATUS_REVERSE_MAP[filters.status] ?? 0 }),
      ...(filters.jobTitleId && { jobTitleId: filters.jobTitleId }),
      ...(filters.requestedById && { createdBy: filters.requestedById }),
      AND: [
        ...(filters.search
          ? [{
              OR: [
                { code: { contains: filters.search } },
                { purpose: { contains: filters.search } },
                { reason: { contains: filters.search } }
              ]
            }]
          : []),
        ...(Object.keys(roleWhere).length > 0 ? [roleWhere] : []),
      ],
    }

    const [rawItems, total] = await prisma.$transaction([
      prisma.employeeRequest.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit
      }),
      prisma.employeeRequest.count({ where })
    ])

    // Enrich with job titles and departments
    const items: EmployeeRequestWithRelations[] = await Promise.all(
      rawItems.map(async (item: EmployeeRequest & { createdByUser?: { id: number; name: string | null; email: string; displayName: string } | null }) => {
        const [jobTitle, department] = await Promise.all([
          fetchJobTitle(item.jobTitleId),
          fetchDepartmentByJobTitle(item.jobTitleId)
        ])
        return { ...item, jobTitle, department } as EmployeeRequestWithRelations
      })
    )

    return success({ items, total })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch employee requests'
    return failure(message)
  }
}

export async function findById(id: number): Promise<RepositoryResult<EmployeeRequestWithRelations | null>> {
  try {
    const employeeRequest = await prisma.employeeRequest.findFirst({
      where: { id: BigInt(id), isDeleted: 0 },
      include: includeRelations
    })

    if (!employeeRequest) {
      return success(null)
    }

    // Enrich with job title, department, and comments
    const [jobTitle, department, comments] = await Promise.all([
      fetchJobTitle(employeeRequest.jobTitleId),
      fetchDepartmentByJobTitle(employeeRequest.jobTitleId),
      fetchComments(Number(employeeRequest.id))
    ])

    return success({ ...employeeRequest, jobTitle, department, comments } as EmployeeRequestWithRelations)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to find employee request by id'
    return failure(message)
  }
}

export async function create(data: CreateEmployeeRequestData): Promise<RepositoryResult<EmployeeRequestWithRelations>> {
  try {
    const code = await generateCode()
    const statusInt = data.status ? (STATUS_REVERSE_MAP[data.status] ?? 0) : 0
    const genderEnum = data.genderPreference ? (GENDER_REVERSE_MAP[data.genderPreference] as 'M' | 'F' | 'A' ?? 'A') : 'A'

    const employeeRequest = await prisma.employeeRequest.create({
      data: {
        code,
        jobTitleId: data.jobTitleId,
        reason: data.reason,
        purpose: data.purpose,
        generalJobPurpose: data.generalJobPurpose || data.purpose,
        jobDescription: data.jobDescription || '',
        jobRequirement: data.jobRequirement || '',
        education: data.education,
        experience: data.experience,
        gender: genderEnum,
        ageFrom: data.ageMin || 18,
        ageTo: data.ageMax || 60,
        jobPlacement: data.jobPlacement || '',
        budget: data.budget || '',
        expectedOnboardDate: data.expectedOnboardDate || new Date(),
        statusEmployeeRequest: statusInt,
        statusRecruitment: 0,
        codeRecruitment: '',
        createdBy: data.createdBy,
        isDeleted: 0,
        createdAt: new Date()
      },
      include: includeRelations
    })

    // Enrich with job title and department
    const [jobTitle, department] = await Promise.all([
      fetchJobTitle(employeeRequest.jobTitleId),
      fetchDepartmentByJobTitle(employeeRequest.jobTitleId)
    ])

    return success({ ...employeeRequest, jobTitle, department, comments: [] } as EmployeeRequestWithRelations)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create employee request'
    return failure(message)
  }
}

export async function update(id: number, data: UpdateEmployeeRequestData): Promise<RepositoryResult<EmployeeRequestWithRelations>> {
  try {
    const updateData: Prisma.EmployeeRequestUncheckedUpdateInput = {}

    if (data.jobTitleId !== undefined) updateData.jobTitleId = data.jobTitleId
    if (data.reason !== undefined) updateData.reason = data.reason
    if (data.purpose !== undefined) updateData.purpose = data.purpose
    if (data.generalJobPurpose !== undefined) updateData.generalJobPurpose = data.generalJobPurpose
    if (data.jobDescription !== undefined) updateData.jobDescription = data.jobDescription
    if (data.jobRequirement !== undefined) updateData.jobRequirement = data.jobRequirement
    if (data.education !== undefined) updateData.education = data.education
    if (data.experience !== undefined) updateData.experience = data.experience
    if (data.genderPreference !== undefined) {
      updateData.gender = (GENDER_REVERSE_MAP[data.genderPreference] as 'M' | 'F' | 'A') ?? 'A'
    }
    if (data.ageMin !== undefined) updateData.ageFrom = data.ageMin
    if (data.ageMax !== undefined) updateData.ageTo = data.ageMax
    if (data.jobPlacement !== undefined) updateData.jobPlacement = data.jobPlacement
    if (data.budget !== undefined) updateData.budget = data.budget
    if (data.expectedOnboardDate !== undefined) updateData.expectedOnboardDate = data.expectedOnboardDate
    if (data.statusEmployeeRequest !== undefined) updateData.statusEmployeeRequest = data.statusEmployeeRequest
    if (data.statusRecruitment !== undefined) updateData.statusRecruitment = data.statusRecruitment
    if (data.codeRecruitment !== undefined) updateData.codeRecruitment = data.codeRecruitment
    if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId
    if (data.hodReviewedBy !== undefined) updateData.hodReviewedBy = data.hodReviewedBy
    if (data.hodReviewedAt !== undefined) updateData.hodReviewedAt = data.hodReviewedAt
    if (data.hrReviewedBy !== undefined) updateData.hrReviewedBy = data.hrReviewedBy
    if (data.hrReviewedAt !== undefined) updateData.hrReviewedAt = data.hrReviewedAt
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy
    if (data.revisedBy !== undefined) updateData.revisedBy = data.revisedBy
    if (data.revisedAt !== undefined) updateData.revisedAt = data.revisedAt
    if (data.rejectedBy !== undefined) updateData.rejectedBy = data.rejectedBy
    if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt
    if (data.recruitmentStartedAt !== undefined) {
      updateData.recruitmentStartedAt = data.recruitmentStartedAt
    }
    updateData.updatedAt = new Date()

    const employeeRequest = await prisma.employeeRequest.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: includeRelations
    })

    // Enrich with job title, department, and comments
    const [jobTitle, department, comments] = await Promise.all([
      fetchJobTitle(employeeRequest.jobTitleId),
      fetchDepartmentByJobTitle(employeeRequest.jobTitleId),
      fetchComments(Number(employeeRequest.id))
    ])

    return success({ ...employeeRequest, jobTitle, department, comments } as EmployeeRequestWithRelations)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update employee request'
    return failure(message)
  }
}

export async function softDelete(id: number): Promise<RepositoryResult<boolean>> {
  try {
    await prisma.employeeRequest.update({
      where: { id: BigInt(id) },
      data: { isDeleted: 1, updatedAt: new Date() }
    })
    return success(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete employee request'
    return failure(message)
  }
}

export async function addComment(
  employeeRequestId: number,
  data: {
    userId: number
    comment: string
  }
): Promise<RepositoryResult<EmployeeRequestComment & { user?: { id: number; name: string | null; displayName: string; role?: { roleName: string | null } | null } | null }>> {
  try {
    const commentData = await prisma.employeeRequestComment.create({
      data: {
        employeeRequestId,
        userId: data.userId,
        comment: data.comment
      },
      include: {
        user: {
          select: { id: true, name: true, displayName: true, role: { select: { roleName: true } } }
        }
      }
    })
    return success(commentData)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add comment'
    return failure(message)
  }
}

export async function getStats(roleFilter?: RoleFilter): Promise<RepositoryResult<Record<string, number>>> {
  try {
    const roleWhere = roleFilter ? buildRoleWhereClause(roleFilter) : {}

    const stats = await prisma.employeeRequest.groupBy({
      by: ['statusEmployeeRequest'],
      where: {
        isDeleted: 0,
        ...(Object.keys(roleWhere).length > 0 ? { AND: [roleWhere] } : {}),
      },
      _count: { statusEmployeeRequest: true }
    })

    const result: Record<string, number> = {
      total: 0,
      draft: 0,
      created: 0,
      hod_reviewed: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0,
      revise: 0,
      in_recruitment: 0,
      completed: 0
    }

    let total = 0
    for (const stat of stats) {
      const statusName = STATUS_MAP[stat.statusEmployeeRequest] || 'draft'
      result[statusName] = stat._count.statusEmployeeRequest
      total += stat._count.statusEmployeeRequest
    }
    result.total = total

    return success(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats'
    return failure(message)
  }
}

// Generate recruitment code when starting recruitment
// Format: RC.2026030001 (RC.YYYYMM0001)
export async function generateRecruitmentCode(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const prefix = `RC.${year}${month}`

  const lastRequest = await prisma.employeeRequest.findFirst({
    where: {
      codeRecruitment: { startsWith: prefix },
      isDeleted: 0
    },
    orderBy: { codeRecruitment: 'desc' }
  })

  let sequence = 1
  if (lastRequest && lastRequest.codeRecruitment) {
    // Extract last 4 digits as sequence number (format: RC.2026030001)
    const lastSequence = parseInt(lastRequest.codeRecruitment.slice(-4) || '0', 10)
    sequence = lastSequence + 1
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`
}
