import type { FastifyRequest, FastifyReply } from 'fastify'

import type { RoleIdParam } from '../schemas/roleSchemas.js'
import type { RoleQuery, CreateRoleBody, UpdateRoleBody } from '../schemas/roleSchemas.js'
import * as roleService from '../services/roleService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: RoleQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name } = request.query

  const filters = {
    ...(name && { name })
  }

  const pagination = { page, limit }

  const result = await roleService.getAllRoles(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: RoleIdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const role = await roleService.getRoleById(id)

  sendSuccess(reply, role)
}

export async function create(
  request: FastifyRequest<{ Body: CreateRoleBody }>,
  reply: FastifyReply
): Promise<void> {
  const data = {
    roleName: request.body.roleName
  }

  const role = await roleService.createRole(data)

  sendSuccess(reply, role, 'Role created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: RoleIdParam; Body: UpdateRoleBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    roleName: request.body.roleName
  }

  const role = await roleService.updateRole(id, data)

  sendSuccess(reply, role, 'Role updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: RoleIdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await roleService.deleteRole(id)

  reply.status(204).send()
}
