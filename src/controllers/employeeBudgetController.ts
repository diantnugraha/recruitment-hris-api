import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type {
  EmployeeBudgetQuery,
  CreateEmployeeBudgetBody,
  UpdateEmployeeBudgetBody,
  SummaryQuery,
  RestBudgetQuery
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

export async function getRestBudget(
  request: FastifyRequest<{ Querystring: RestBudgetQuery }>,
  reply: FastifyReply
): Promise<void> {
  const { department_id, year } = request.query

  const restBudget = await employeeBudgetService.getRestBudget(department_id, year)

  sendSuccess(reply, restBudget)
}

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]
const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadDocument(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const file = await request.file()
  if (!file) {
    reply.status(400).send({ success: false, message: 'No file uploaded' })
    return
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    reply.status(400).send({
      success: false,
      message: 'Invalid file type. Allowed: PDF, JPEG, PNG'
    })
    return
  }

  const chunks: Buffer[] = []
  for await (const chunk of file.file) {
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  if (buffer.length > MAX_DOCUMENT_FILE_SIZE) {
    reply.status(400).send({
      success: false,
      message: 'File too large. Maximum size: 10MB'
    })
    return
  }

  const result = await employeeBudgetService.uploadDocument(
    id,
    buffer,
    file.filename,
    file.mimetype
  )

  sendSuccess(reply, result, 'Document uploaded successfully')
}

export async function getDocument(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const document = await employeeBudgetService.getDocument(id)

  sendSuccess(reply, document)
}

export async function deleteDocument(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  await employeeBudgetService.deleteDocument(id)

  sendSuccess(reply, null, 'Document deleted successfully')
}
