import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type { EmployeeQuery, CreateEmployeeBody, UpdateEmployeeBody } from '../schemas/employeeSchemas.js'
import * as employeeService from '../services/employeeService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: EmployeeQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, name, email, status, gender, location, business_unit } = request.query

  const filters = {
    ...(name && { name }),
    ...(email && { email }),
    ...(status && { status }),
    ...(gender && { gender }),
    ...(location && { location }),
    ...(business_unit && { businessUnit: business_unit })
  }

  const pagination = { page, limit }

  const result = await employeeService.getAllEmployees(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const employee = await employeeService.getEmployeeById(id)

  sendSuccess(reply, employee)
}

export async function create(
  request: FastifyRequest<{ Body: CreateEmployeeBody }>,
  reply: FastifyReply
): Promise<void> {
  const body = request.body

  const data = {
    name: body.name,
    ...(body.nickname !== undefined && { nickname: body.nickname }),
    ...(body.email !== undefined && { email: body.email }),
    ...(body.contact !== undefined && { contact: body.contact }),
    ...(body.gender !== undefined && { gender: body.gender }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.title !== undefined && { title: body.title }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.business_unit !== undefined && { businessUnit: body.business_unit }),
    ...(body.extension !== undefined && { extension: body.extension }),
    ...(body.join_date !== undefined && { joinDate: new Date(body.join_date) }),
    ...(body.birth_date !== undefined && { birthDate: new Date(body.birth_date) }),
    ...(body.permanent_date !== undefined && { permanentDate: new Date(body.permanent_date) }),
    ...(body.superior_id !== undefined && { superiorId: body.superior_id })
  }

  const employee = await employeeService.createEmployee(data)

  sendSuccess(reply, employee, 'Employee created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateEmployeeBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const body = request.body

  const data = {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.nickname !== undefined && { nickname: body.nickname }),
    ...(body.email !== undefined && { email: body.email }),
    ...(body.contact !== undefined && { contact: body.contact }),
    ...(body.gender !== undefined && { gender: body.gender }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.title !== undefined && { title: body.title }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.business_unit !== undefined && { businessUnit: body.business_unit }),
    ...(body.extension !== undefined && { extension: body.extension }),
    ...(body.join_date !== undefined && { joinDate: new Date(body.join_date) }),
    ...(body.birth_date !== undefined && { birthDate: new Date(body.birth_date) }),
    ...(body.permanent_date !== undefined && { permanentDate: new Date(body.permanent_date) }),
    ...(body.superior_id !== undefined && { superiorId: body.superior_id })
  }

  const employee = await employeeService.updateEmployee(id, data)

  sendSuccess(reply, employee, 'Employee updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await employeeService.deleteEmployee(id)

  reply.status(204).send()
}
