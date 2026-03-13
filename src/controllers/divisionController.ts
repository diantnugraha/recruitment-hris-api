import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  DivisionQuery,
  CreateDivisionBody,
  UpdateDivisionBody,
  AssignHeadBody
} from '../schemas/divisionSchemas.js'
import * as divisionService from '../services/divisionService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: DivisionQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, code, obs_id, is_management } = request.query

  const filters = {
    ...(name && { name }),
    ...(code && { code }),
    ...(obs_id && { obsId: obs_id }),
    ...(is_management !== undefined && { isManagement: is_management })
  }

  const pagination = { page, limit }

  const result = await divisionService.getAllDivisions(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const division = await divisionService.getDivisionById(id)

  sendSuccess(reply, division)
}

export async function create(
  request: FastifyRequest<{ Body: CreateDivisionBody }>,
  reply: FastifyReply
): Promise<void> {
  const { name, code, obsId, isManagement, headOfDivisionId, deputyHeadId, description } = request.body

  const data = {
    name,
    ...(code && { code }),
    ...(obsId && { obsId }),
    ...(isManagement !== undefined && { isManagement }),
    ...(headOfDivisionId && { headOfDivisionId }),
    ...(deputyHeadId && { deputyHeadId }),
    ...(description && { description })
  }

  const division = await divisionService.createDivision(data)

  sendSuccess(reply, division, 'Division created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateDivisionBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { name, code, obsId, isManagement, headOfDivisionId, deputyHeadId, description } = request.body

  const data = {
    ...(name && { name }),
    ...(code !== undefined && { code }),
    ...(obsId !== undefined && { obsId }),
    ...(isManagement !== undefined && { isManagement }),
    ...(headOfDivisionId !== undefined && { headOfDivisionId }),
    ...(deputyHeadId !== undefined && { deputyHeadId }),
    ...(description !== undefined && { description })
  }

  const division = await divisionService.updateDivision(id, data)

  sendSuccess(reply, division, 'Division updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await divisionService.deleteDivision(id)

  reply.status(204).send()
}

export async function assignHead(
  request: FastifyRequest<{ Params: IdParam; Body: AssignHeadBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { employeeId } = request.body

  const division = await divisionService.assignHeadOfDivision(id, employeeId)

  sendSuccess(reply, division, 'Head of division assigned successfully')
}

export async function removeHead(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const division = await divisionService.removeHeadOfDivision(id)

  sendSuccess(reply, division, 'Head of division removed successfully')
}

export async function assignDeputy(
  request: FastifyRequest<{ Params: IdParam; Body: AssignHeadBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const { employeeId } = request.body

  const division = await divisionService.assignDeputyHead(id, employeeId)

  sendSuccess(reply, division, 'Deputy head assigned successfully')
}

export async function removeDeputy(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const division = await divisionService.removeDeputyHead(id)

  sendSuccess(reply, division, 'Deputy head removed successfully')
}

export async function getManagement(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const divisions = await divisionService.getManagementDivisions()

  sendSuccess(reply, divisions)
}
