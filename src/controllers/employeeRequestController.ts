import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
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
    reviewed_at: request.reviewedAt?.toISOString() || null,
    approved_at: request.approvedAt?.toISOString() || null,
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
  const { page = 1, limit = 20, status, job_title_id, requested_by_id, search } = request.query

  const filters = {
    ...(status && { status }),
    ...(job_title_id && { jobTitleId: job_title_id }),
    ...(requested_by_id && { requestedById: requested_by_id }),
    ...(search && { search })
  }

  const pagination = { page, limit }

  const result = await employeeRequestService.getAllEmployeeRequests(filters, pagination)

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
  const user = request.user

  const employeeRequest = await employeeRequestService.updateEmployeeRequestStatus(id, status, user.userId, comment)
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
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const stats = await employeeRequestService.getStats()

  sendSuccess(reply, stats)
}

export async function startRecruitment(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const user = request.user

  const employeeRequest = await employeeRequestService.startRecruitment(id, user.userId)
  const transformed = transformEmployeeRequest(employeeRequest)

  sendSuccess(reply, transformed, 'Recruitment started successfully')
}
