import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type { ObsQuery, CreateObsBody, UpdateObsBody } from '../schemas/obsSchemas.js'
import * as obsService from '../services/obsService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: ObsQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, cluster, description } = request.query

  const filters = {
    ...(name && { name }),
    ...(cluster && { cluster }),
    ...(description && { description })
  }

  const pagination = { page, limit }

  const result = await obsService.getAllObs(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const obs = await obsService.getObsById(id)

  sendSuccess(reply, obs)
}

export async function create(
  request: FastifyRequest<{ Body: CreateObsBody }>,
  reply: FastifyReply
): Promise<void> {
  const data = {
    name: request.body.name,
    cluster: request.body.cluster,
    description: request.body.description
  }

  const obs = await obsService.createObs(data)

  sendSuccess(reply, obs, 'OBS created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateObsBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    name: request.body.name,
    cluster: request.body.cluster,
    description: request.body.description
  }

  const obs = await obsService.updateObs(id, data)

  sendSuccess(reply, obs, 'OBS updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await obsService.deleteObs(id)

  reply.status(204).send()
}
