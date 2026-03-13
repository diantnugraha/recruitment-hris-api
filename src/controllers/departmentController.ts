import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  DepartmentQuery,
  CreateDepartmentBody,
  UpdateDepartmentBody,
  AssignManagerBody
} from '../schemas/departmentSchemas.js'
import * as departmentService from '../services/departmentService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: DepartmentQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, code, division_id, category, is_management } = request.query

  const filters = {
    ...(name && { name }),
    ...(code && { code }),
    ...(division_id && { divisionId: division_id }),
    ...(category && { category }),
    ...(is_management !== undefined && { isManagement: is_management })
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

export async function getByDivision(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const departments = await departmentService.getDepartmentsByDivision(id)

  sendSuccess(reply, departments)
}

export async function create(
  request: FastifyRequest<{ Body: CreateDepartmentBody }>,
  reply: FastifyReply
): Promise<void> {
  const { name, code, divisionId, managerId, category, description } = request.body

  const data = {
    name,
    code,
    divisionId,
    ...(managerId && { managerId }),
    ...(category && { category }),
    ...(description && { description })
  }

  const department = await departmentService.createDepartment(data)

  sendSuccess(reply, department, 'Department created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateDepartmentBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { name, code, divisionId, managerId, category, description } = request.body

  const data = {
    ...(name && { name }),
    ...(code && { code }),
    ...(divisionId && { divisionId }),
    ...(managerId !== undefined && { managerId }),
    ...(category !== undefined && { category }),
    ...(description !== undefined && { description })
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

export async function assignManager(
  request: FastifyRequest<{ Params: IdParam; Body: AssignManagerBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { employeeId } = request.body

  const department = await departmentService.assignManager(id, employeeId)

  sendSuccess(reply, department, 'Manager assigned successfully')
}

export async function removeManager(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const department = await departmentService.removeManager(id)

  sendSuccess(reply, department, 'Manager removed successfully')
}
