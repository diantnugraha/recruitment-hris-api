import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  JobLevelQuery,
  CreateJobLevelBody,
  UpdateJobLevelBody
} from '../schemas/jobLevelSchemas.js'
import * as jobLevelService from '../services/jobLevelService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: JobLevelQuery }>,
  reply: FastifyReply
): Promise<void> {
  const {
    page = 1,
    limit = 20,
    name,
    category,
    description,
    can_create_job_title,
    can_create_kpi,
    order_gte
  } = request.query

  const filters = {
    ...(name && { name }),
    ...(category && { category }),
    ...(description && { description }),
    ...(can_create_job_title !== undefined && { can_create_job_title }),
    ...(can_create_kpi !== undefined && { can_create_kpi }),
    ...(order_gte !== undefined && { order_gte })
  }

  const pagination = { page, limit }

  const result = await jobLevelService.getAllJobLevels(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const jobLevel = await jobLevelService.getJobLevelById(id)

  sendSuccess(reply, jobLevel)
}

export async function create(
  request: FastifyRequest<{ Body: CreateJobLevelBody }>,
  reply: FastifyReply
): Promise<void> {
  const data: Parameters<typeof jobLevelService.createJobLevel>[0] = {
    name: request.body.name,
    category: request.body.category,
    ...(request.body.description !== undefined && { description: request.body.description }),
    ...(request.body.can_create_job_title !== undefined && {
      can_create_job_title: request.body.can_create_job_title
    }),
    ...(request.body.can_create_kpi !== undefined && {
      can_create_kpi: request.body.can_create_kpi
    }),
    ...(request.body.order !== undefined && { order: request.body.order })
  }

  const jobLevel = await jobLevelService.createJobLevel(data)

  sendSuccess(reply, jobLevel, 'Job level created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateJobLevelBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data: Parameters<typeof jobLevelService.updateJobLevel>[1] = {
    ...(request.body.name !== undefined && { name: request.body.name }),
    ...(request.body.category !== undefined && { category: request.body.category }),
    ...(request.body.description !== undefined && { description: request.body.description }),
    ...(request.body.can_create_job_title !== undefined && {
      can_create_job_title: request.body.can_create_job_title
    }),
    ...(request.body.can_create_kpi !== undefined && {
      can_create_kpi: request.body.can_create_kpi
    }),
    ...(request.body.order !== undefined && { order: request.body.order })
  }

  const jobLevel = await jobLevelService.updateJobLevel(id, data)

  sendSuccess(reply, jobLevel, 'Job level updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await jobLevelService.deleteJobLevel(id)

  reply.status(204).send()
}
