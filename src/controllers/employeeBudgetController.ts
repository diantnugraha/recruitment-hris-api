import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  EmployeeBudgetQuery,
  CreateEmployeeBudgetBody,
  UpdateEmployeeBudgetBody,
  SummaryQuery
} from '../schemas/employeeBudgetSchemas.js'
import * as employeeBudgetService from '../services/employeeBudgetService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'

export async function getAll(
  request: FastifyRequest<{ Querystring: EmployeeBudgetQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { page = 1, limit = 20, department_id, year } = request.query

  const filters = {
    ...(department_id && { departmentId: department_id }),
    ...(year && { year })
  }

  const pagination = { page, limit }

  const result = await employeeBudgetService.getAllEmployeeBudgets(filters, pagination)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, result.items, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const budget = await employeeBudgetService.getEmployeeBudgetById(id)

  sendSuccess(reply, budget)
}

export async function create(
  request: FastifyRequest<{ Body: CreateEmployeeBudgetBody }>,
  reply: FastifyReply
): Promise<void> {
  const data = {
    departmentId: request.body.departmentId,
    year: request.body.year,
    technical: request.body.technical ?? 0,
    admin: request.body.admin ?? 0,
    document: request.body.document
  }

  const budget = await employeeBudgetService.createEmployeeBudget(data)

  sendSuccess(reply, budget, 'Employee budget created successfully', 201)
}

export async function update(
  request: FastifyRequest<{ Params: IdParam; Body: UpdateEmployeeBudgetBody }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params
  const data = {
    ...(request.body.departmentId !== undefined && { departmentId: request.body.departmentId }),
    ...(request.body.year !== undefined && { year: request.body.year }),
    ...(request.body.technical !== undefined && { technical: request.body.technical }),
    ...(request.body.admin !== undefined && { admin: request.body.admin }),
    ...(request.body.document !== undefined && { document: request.body.document })
  }

  const budget = await employeeBudgetService.updateEmployeeBudget(id, data)

  sendSuccess(reply, budget, 'Employee budget updated successfully')
}

export async function remove(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await employeeBudgetService.deleteEmployeeBudget(id)

  reply.status(204).send()
}

export async function getSummary(
  request: FastifyRequest<{ Querystring: SummaryQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { year } = request.query

  const summary = await employeeBudgetService.getBudgetSummary(year)

  sendSuccess(reply, summary)
}
