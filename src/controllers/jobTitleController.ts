import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  JobTitleQuery,
  CreateJobTitleBody,
  UpdateJobTitleBody
} from '../schemas/jobTitleSchemas.js'
import * as jobTitleService from '../services/jobTitleService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

function parseDepartmentIds(departmentIdString?: string): number[] | undefined {
  if (!departmentIdString) return undefined

  return departmentIdString
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id) && id > 0)
}

export async function getAll(
  request: FastifyRequest<{ Querystring: JobTitleQuery }>,
  reply: FastifyReply
): Promise<void> {
  const {
    page = 1,
    limit = 20,
    name,
    description,
    purpose,
    requirement,
    job_level_id,
    direct_report_id,
    department_id,
    order_gte
  } = request.query

  const departmentIds = parseDepartmentIds(department_id)

  const filters = {
    ...(name && { name }),
    ...(description && { description }),
    ...(purpose && { purpose }),
    ...(requirement && { requirement }),
    ...(job_level_id !== undefined && { job_level_id }),
    ...(direct_report_id !== undefined && { direct_report_id }),
    ...(departmentIds && { department_ids: departmentIds }),
    ...(order_gte !== undefined && { order_gte })
  }

  const pagination = { page, limit }

  const result = await jobTitleService.getAllJobTitles(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const jobTitle = await jobTitleService.getJobTitleById(id)

  sendSuccess(reply, jobTitle)
}

export async function create(
  request: FastifyRequest<{ Body: CreateJobTitleBody }>,
  reply: FastifyReply
): Promise<void> {
  const data: Parameters<typeof jobTitleService.createJobTitle>[0] = {
    name: request.body.name,
    job_level_id: request.body.job_level_id,
    type: request.body.type,
    ...(request.body.division_id !== undefined && { division_id: request.body.division_id }),
    ...(request.body.direct_report_id !== undefined && {
      direct_report_id: request.body.direct_report_id
    }),
    ...(request.body.description !== undefined && { description: request.body.description }),
    ...(request.body.purpose !== undefined && { purpose: request.body.purpose }),
    ...(request.body.requirement !== undefined && { requirement: request.body.requirement }),
    ...(request.body.department_sync !== undefined && {
      department_sync: request.body.department_sync
    }),
    ...(request.body.department_attach !== undefined && {
      department_attach: request.body.department_attach
    })
  }

  const jobTitle = await jobTitleService.createJobTitle(data)

  sendSuccess(reply, jobTitle, 'Job title created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateJobTitleBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data: Parameters<typeof jobTitleService.updateJobTitle>[1] = {
    ...(request.body.name !== undefined && { name: request.body.name }),
    ...(request.body.job_level_id !== undefined && { job_level_id: request.body.job_level_id }),
    ...(request.body.division_id !== undefined && { division_id: request.body.division_id }),
    ...(request.body.direct_report_id !== undefined && {
      direct_report_id: request.body.direct_report_id
    }),
    ...(request.body.type !== undefined && { type: request.body.type }),
    ...(request.body.description !== undefined && { description: request.body.description }),
    ...(request.body.purpose !== undefined && { purpose: request.body.purpose }),
    ...(request.body.requirement !== undefined && { requirement: request.body.requirement }),
    ...(request.body.department_attach !== undefined && {
      department_attach: request.body.department_attach
    }),
    ...(request.body.department_detach !== undefined && {
      department_detach: request.body.department_detach
    }),
    ...(request.body.department_sync !== undefined && {
      department_sync: request.body.department_sync
    })
  }

  const jobTitle = await jobTitleService.updateJobTitle(id, data)

  sendSuccess(reply, jobTitle, 'Job title updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await jobTitleService.deleteJobTitle(id)

  reply.status(204).send()
}
