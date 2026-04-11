import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import { getSlaInfo } from '../services/slaService.js'
import type {
  EmployeeRequestQuery,
  CreateEmployeeRequestBody,
  UpdateEmployeeRequestBody,
  UpdateEmployeeRequestStatusBody,
  AddCommentBody
} from '../schemas/employeeRequestSchemas.js'
import * as employeeRequestService from '../services/employeeRequestService.js'
import { STATUS_MAP, GENDER_MAP } from '../repositories/employeeRequestRepository.js'
import type { EmployeeRequestWithRelations } from '../repositories/employeeRequestRepository.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'
import { generateEmployeeRequestPdf, extractTextLines } from '../services/employeeRequestPdfService.js'
import type { EmployeeRequestPdfData } from '../services/employeeRequestPdfService.js'
import { prisma } from '../config/database.js'
import { getRestBudget } from '../services/employeeBudgetService.js'

// Transform employee request for API response
function transformEmployeeRequest(request: EmployeeRequestWithRelations) {
  // Convert integer status to string
  const statusString = STATUS_MAP[request.statusEmployeeRequest] || 'draft'
  // Convert gender enum to string
  const genderString = GENDER_MAP[request.gender] || 'any'

  return {
    id: Number(request.id),
    code: request.code,
    job_title_id: request.jobTitleId,
    reason: request.reason,
    purpose: request.purpose,
    general_job_purpose: request.generalJobPurpose,
    job_description: request.jobDescription,
    job_requirement: request.jobRequirement,
    education: request.education,
    experience: request.experience,
    gender_preference: genderString,
    age_min: request.ageFrom,
    age_max: request.ageTo,
    job_placement: request.jobPlacement,
    budget: request.budget,
    expected_onboard_date: request.expectedOnboardDate?.toISOString().split('T')[0] || null,
    status: statusString,
    status_recruitment: request.statusRecruitment,
    recruitment_code: request.codeRecruitment || null,
    requested_by_id: request.createdBy,
    requested_by_name: request.createdByUser?.displayName || request.createdByUser?.name || request.createdByUser?.email,
    hod_reviewed_at: request.hodReviewedAt?.toISOString() || null,
    hod_reviewed_by: request.hodReviewedBy,
    hr_reviewed_at: request.hrReviewedAt?.toISOString() || null,
    hr_reviewed_by: request.hrReviewedBy,
    approved_by: request.approvedBy,
    approved_at: request.approvedAt?.toISOString() || null,
    revised_by: request.revisedBy,
    revised_at: request.revisedAt?.toISOString() || null,
    rejected_by: request.rejectedBy,
    rejected_at: request.rejectedAt?.toISOString() || null,
    recruitment_started_at: request.recruitmentStartedAt?.toISOString() || null,
    sla: (request.statusEmployeeRequest === 6 || request.statusEmployeeRequest === 7)
      ? getSlaInfo(request.recruitmentStartedAt || null)
      : null,
    department_id: request.departmentId,
    created_at: request.createdAt?.toISOString() || null,
    updated_at: request.updatedAt?.toISOString() || null,
    job_title: request.jobTitle ? {
      id: Number(request.jobTitle.id),
      name: request.jobTitle.name
    } : null,
    department: request.department ? {
      id: request.department.id,
      name: request.department.name,
      code: request.department.code
    } : null,
    requested_by: request.createdByUser ? {
      id: request.createdByUser.id,
      name: request.createdByUser.name,
      email: request.createdByUser.email,
      display_name: request.createdByUser.displayName
    } : null,
    comments: request.comments?.map((c: {
      id: bigint
      employeeRequestId: number
      userId: number
      comment: string
      createdAt: Date | null
      updatedAt: Date | null
      user?: { id: number; name: string | null; displayName: string; role?: { roleName: string | null } | null } | null
    }) => ({
      id: Number(c.id),
      employee_request_id: c.employeeRequestId,
      user_id: c.userId,
      user_name: c.user?.displayName || c.user?.name,
      user_role: c.user?.role?.roleName || null,
      comment: c.comment,
      created_at: c.createdAt?.toISOString() || null
    }))
  }
}

export async function getAll(
  request: FastifyRequest<{ Querystring: EmployeeRequestQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, status, department_id, job_title_id, requested_by_id, search } = request.query

  const filters = {
    ...(status && { status }),
    ...(department_id && { departmentId: department_id }),
    ...(job_title_id && { jobTitleId: job_title_id }),
    ...(requested_by_id && { requestedById: requested_by_id }),
    ...(search && { search })
  }

  const pagination = { page, limit }

  const roleFilter = request.enrichedUser ? {
    roleName: request.enrichedUser.roleName,
    userId: request.enrichedUser.userId,
    managedDepartmentIds: request.enrichedUser.managedDepartmentIds,
    hodDivisionIds: request.enrichedUser.headOfDivisionIds,
  } : undefined

  const result = await employeeRequestService.getAllEmployeeRequests(filters, pagination, roleFilter)

  const transformedItems = result.items.map(transformEmployeeRequest)
  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, transformedItems, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const employeeRequest = await employeeRequestService.getEmployeeRequestById(id)
  const transformed = transformEmployeeRequest(employeeRequest)

  sendSuccess(reply, transformed)
}

export async function create(
  request: FastifyRequest<{ Body: CreateEmployeeRequestBody }>,
  reply: FastifyReply
): Promise<void> {
  const body = request.body
  const user = request.user

  const data = {
    jobTitleId: body.job_title_id,
    reason: body.reason,
    purpose: body.purpose,
    ...(body.general_job_purpose !== undefined && { generalJobPurpose: body.general_job_purpose }),
    ...(body.job_description !== undefined && { jobDescription: body.job_description }),
    ...(body.job_requirement !== undefined && { jobRequirement: body.job_requirement }),
    education: body.education,
    experience: body.experience,
    genderPreference: body.gender_preference,
    ...(body.age_min !== undefined && { ageMin: body.age_min }),
    ...(body.age_max !== undefined && { ageMax: body.age_max }),
    ...(body.job_placement !== undefined && { jobPlacement: body.job_placement }),
    ...(body.budget !== undefined && { budget: body.budget }),
    ...(body.expected_onboard_date !== undefined && { expectedOnboardDate: new Date(body.expected_onboard_date) }),
    ...(body.department_id !== undefined && { departmentId: body.department_id }),
    status: body.status || 'draft',
    createdBy: user.userId
  }

  const employeeRequest = await employeeRequestService.createEmployeeRequest(data)
  const transformed = transformEmployeeRequest(employeeRequest)

  sendSuccess(reply, transformed, 'Employee request created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateEmployeeRequestBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const body = request.body

  const data = {
    ...(body.job_title_id !== undefined && { jobTitleId: body.job_title_id }),
    ...(body.reason !== undefined && { reason: body.reason }),
    ...(body.purpose !== undefined && { purpose: body.purpose }),
    ...(body.general_job_purpose !== undefined && { generalJobPurpose: body.general_job_purpose }),
    ...(body.job_description !== undefined && { jobDescription: body.job_description }),
    ...(body.job_requirement !== undefined && { jobRequirement: body.job_requirement }),
    ...(body.education !== undefined && { education: body.education }),
    ...(body.experience !== undefined && { experience: body.experience }),
    ...(body.gender_preference !== undefined && { genderPreference: body.gender_preference }),
    ...(body.age_min !== undefined && { ageMin: body.age_min }),
    ...(body.age_max !== undefined && { ageMax: body.age_max }),
    ...(body.job_placement !== undefined && { jobPlacement: body.job_placement }),
    ...(body.budget !== undefined && { budget: body.budget }),
    ...(body.expected_onboard_date !== undefined && {
      expectedOnboardDate: new Date(body.expected_onboard_date)
    })
  }

  const employeeRequest = await employeeRequestService.updateEmployeeRequest(id, data)
  const transformed = transformEmployeeRequest(employeeRequest)

  sendSuccess(reply, transformed, 'Employee request updated successfully')
}

export async function updateStatus(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateEmployeeRequestStatusBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { status, comment } = request.body

  const enrichedUser = request.enrichedUser
  if (!enrichedUser) {
    throw new Error('Enriched user context is missing')
  }

  const employeeRequest = await employeeRequestService.updateEmployeeRequestStatus(id, status, enrichedUser, comment)
  const transformed = transformEmployeeRequest(employeeRequest)

  sendSuccess(reply, transformed, 'Employee request status updated successfully')
}

export async function addComment(
  request: FastifyRequest<{ Params: IdParam; Body: AddCommentBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { comment } = request.body
  const user = request.user

  const commentData = await employeeRequestService.addComment(id, user.userId, comment)

  sendSuccess(reply, {
    id: Number(commentData.id),
    employee_request_id: commentData.employeeRequestId,
    user_id: commentData.userId,
    user_name: commentData.user?.displayName || commentData.user?.name,
    user_role: commentData.user?.role?.roleName || null,
    comment: commentData.comment,
    created_at: commentData.createdAt?.toISOString() || null
  }, 'Comment added successfully', 201)
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await employeeRequestService.deleteEmployeeRequest(id)

  reply.status(204).send()
}

export async function getStats(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const roleFilter = request.enrichedUser ? {
    roleName: request.enrichedUser.roleName,
    userId: request.enrichedUser.userId,
    managedDepartmentIds: request.enrichedUser.managedDepartmentIds,
    hodDivisionIds: request.enrichedUser.headOfDivisionIds,
  } : undefined

  const stats = await employeeRequestService.getStats(roleFilter)

  sendSuccess(reply, stats)
}

export async function startRecruitment(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const enrichedUser = request.enrichedUser
  if (!enrichedUser) {
    throw new Error('Enriched user context is missing')
  }

  const employeeRequest = await employeeRequestService.startRecruitment(id, enrichedUser)
  const transformed = transformEmployeeRequest(employeeRequest)

  sendSuccess(reply, transformed, 'Recruitment started successfully')
}

export async function generatePdf(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const employeeRequest = await employeeRequestService.getEmployeeRequestById(id)
  const pdfData = await buildPdfData(employeeRequest)
  const pdfBuffer = await generateEmployeeRequestPdf(pdfData)

  const nameParts = [employeeRequest.code, employeeRequest.jobTitle?.name].filter(Boolean)
  const filename = nameParts.join(' - ') + '.pdf'

  reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `inline; filename="${filename}"`)
    .send(pdfBuffer)
}

async function buildPdfData(er: EmployeeRequestWithRelations): Promise<EmployeeRequestPdfData> {
  const genderString = GENDER_MAP[er.gender] || 'any'

  // Fetch job title with level, division, and department in parallel
  const [jobTitleData, departmentPivot] = await Promise.all([
    prisma.jobTitle.findUnique({
      where: { id: BigInt(er.jobTitleId) },
      include: {
        jobLevel: { select: { name: true } },
        division: { select: { id: true, name: true } }
      }
    }),
    prisma.departmentJobTitle.findFirst({
      where: { jobTitleId: BigInt(er.jobTitleId) },
      include: {
        department: {
          include: {
            division: {
              include: {
                headOfDivision: {
                  select: { employeeId: true, employeeName: true }
                }
              }
            }
          }
        }
      }
    })
  ])

  const department = departmentPivot?.department ?? null
  const division = department?.division ?? jobTitleData?.division ?? null

  // Get rest budget for the department
  const budgetStr = er.budget || ''
  let remainingBudgetStr = ''
  if (department) {
    try {
      const restBudget = await getRestBudget(department.id)
      const jobType = jobTitleData?.type
      if (jobType === 'Technical') {
        remainingBudgetStr = String(restBudget.rest.technical)
      } else {
        remainingBudgetStr = String(restBudget.rest.admin)
      }
    } catch {
      // Budget info unavailable
    }
  }

  const formatDate = (d: Date | string | null | undefined): string => {
    if (!d) return ''
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Extract text from lexical JSON fields
  const jobDescLines = extractTextLines(er.jobDescription)
  const jobReqLines = extractTextLines(er.jobRequirement)
  const isReplacement = er.purpose === 'replacement'

  // Build Head of Division name
  const hodEmployee = division && 'headOfDivision' in division
    ? (division as { headOfDivision?: { employeeName?: string | null } | null }).headOfDivision
    : null
  const hodName = hodEmployee?.employeeName || ''

  return {
    position: er.jobTitle?.name || jobTitleData?.name || '',
    division: division?.name || '',
    department: department?.name || '',
    numberOfRequired: 1,
    requestedDate: formatDate(er.createdAt),
    dateRequired: formatDate(er.expectedOnboardDate),
    positionLevel: jobTitleData?.jobLevel?.name || '',
    typeOfRequest: isReplacement ? 'replacement' : 'new',
    budget: budgetStr,
    remainingBudget: remainingBudgetStr,
    genderMale: genderString === 'male' || genderString === 'any',
    genderFemale: genderString === 'female' || genderString === 'any',
    reason: er.reason || er.generalJobPurpose || '',
    placement: er.jobPlacement || '',
    jobDescriptions: jobDescLines.slice(0, 7),
    minimumAge: er.ageFrom ? String(er.ageFrom) : '',
    maximumAge: er.ageTo ? String(er.ageTo) : '',
    educational: er.education || '',
    majors: '',
    experience: er.experience || '',
    mandatoryCompetencies: jobReqLines.slice(0, 5),
    specialistCompetencies: jobReqLines.slice(5, 8),
    optionalCompetencies: jobReqLines.slice(8, 10),
    createdByName: er.createdByUser?.displayName || er.createdByUser?.name || '',
    createdByDept: department?.name || '',
    acknowledgeByName: hodName,
    checkedByName: '',
    approvedByName: '',
  }
}
