import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type { DepartmentQuery, CreateDepartmentBody, UpdateDepartmentBody } from '../schemas/departmentSchemas.js'
import * as departmentService from '../services/departmentService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: DepartmentQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, code, description, obs_id, division_id, category } = request.query

  const filters = {
    ...(name && { name }),
    ...(code && { code }),
    ...(description && { description }),
    ...(obs_id && { obsId: obs_id }),
    ...(division_id && { divisionId: division_id }),
    ...(category && { category })
  }

  const pagination = { page, limit }

  const result = await departmentService.getAllDepartments(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const department = await departmentService.getDepartmentById(id)

  sendSuccess(reply, department)
}

export async function create(
  request: FastifyRequest<{ Body: CreateDepartmentBody }>,
  reply: FastifyReply
): Promise<void> {
  const data = {
    name: request.body.name,
    code: request.body.code,
    obsId: request.body.obsId,
    divisionId: request.body.divisionId,
    category: request.body.category,
    description: request.body.description
  }

  const department = await departmentService.createDepartment(data)

  sendSuccess(reply, department, 'Department created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateDepartmentBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    name: request.body.name,
    code: request.body.code,
    obsId: request.body.obsId,
    divisionId: request.body.divisionId,
    category: request.body.category,
    description: request.body.description
  }

  const department = await departmentService.updateDepartment(id, data)

  sendSuccess(reply, department, 'Department updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await departmentService.deleteDepartment(id)

  reply.status(204).send()
}
