import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type { DivisionQuery, CreateDivisionBody, UpdateDivisionBody } from '../schemas/divisionSchemas.js'
import * as divisionService from '../services/divisionService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: DivisionQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, code, description } = request.query

  const filters = {
    ...(name && { name }),
    ...(code && { code }),
    ...(description && { description })
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
  const data = {
    name: request.body.name,
    code: request.body.code,
    description: request.body.description
  }

  const division = await divisionService.createDivision(data)

  sendSuccess(reply, division, 'Division created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateDivisionBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    name: request.body.name,
    code: request.body.code,
    description: request.body.description
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
