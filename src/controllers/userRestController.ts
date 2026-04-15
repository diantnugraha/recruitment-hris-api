import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  UserQuery,
  CreateUserBody,
  UpdateUserBody,
  UpdatePasswordBody
} from '../schemas/userSchemas.js'
import * as userRestService from '../services/userRestService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: UserQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, search, orderby, direction, id, display_name, email } = request.query

  const filters = {
    ...(id && { id }),
    ...(display_name && { display_name }),
    ...(email && { email }),
    ...(search && { display_name: search })
  }

  const validOrderBy = (orderby === 'name' ? orderby : 'name') as 'name' | 'email' | 'displayName'

  const pagination = {
    page,
    limit,
    orderBy: validOrderBy,
    direction: direction || 'asc'
  }

  const result = await userRestService.getAllUsers(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.users, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const user = await userRestService.getUserById(id)

  sendSuccess(reply, user)
}

export async function create(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
): Promise<void> {
  const data = {
    displayName: request.body.displayName,
    email: request.body.email,
    ...(request.body.name !== undefined && { name: request.body.name }),
    ...(request.body.password !== undefined && { password: request.body.password }),
    ...(request.body.roleId !== undefined && { roleId: request.body.roleId }),
    ...(request.body.employeeId !== undefined && { employeeId: request.body.employeeId }),
    ...(request.body.superiorId !== undefined && { superiorId: request.body.superiorId })
  }

  const user = await userRestService.createUser(data)

  sendSuccess(reply, user, 'User created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateUserBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    displayName: request.body.displayName,
    email: request.body.email,
    ...(request.body.name !== undefined && { name: request.body.name }),
    ...(request.body.newPassword !== undefined && { newPassword: request.body.newPassword }),
    ...(request.body.roleId !== undefined && { roleId: request.body.roleId }),
    ...(request.body.employeeId !== undefined && { employeeId: request.body.employeeId }),
    ...(request.body.superiorId !== undefined && { superiorId: request.body.superiorId })
  }

  const user = await userRestService.updateUser(id, data)

  sendSuccess(reply, user, 'User updated successfully')
}

export async function updatePassword(
  request: FastifyRequest<{ Params: IdParam; Body: UpdatePasswordBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    currentPassword: request.body.currentPassword,
    newPassword: request.body.newPassword
  }

  const user = await userRestService.updateUserPassword(id, data)

  sendSuccess(reply, user, 'Password updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await userRestService.deleteUser(id)

  reply.status(204).send()
}
