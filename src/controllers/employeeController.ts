import type { FastifyRequest, FastifyReply } from 'fastify'

import type { IdParam } from '../schemas/common.js'
import type { EmployeeQuery, CreateEmployeeBody, UpdateEmployeeBody } from '../schemas/employeeSchemas.js'
import * as employeeService from '../services/employeeService.js'
import { sendSuccess, sendPaginated, calculatePagination } from '../utils/response.js'
import { transformEmployees, transformEmployee, type DepartmentInfo } from '../transformers/employeeTransformer.js'
import { prisma } from '../config/database.js'

/**
 * Build a lookup map: lowercase job title name → DepartmentInfo
 * Resolves: job_titles → department_job_title → departments
 */
async function buildTitleToDeptMap(): Promise<Map<string, DepartmentInfo>> {
  const jobTitles = await prisma.jobTitle.findMany({
    include: {
      departments: {
        include: {
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      }
    }
  })

  const map = new Map<string, DepartmentInfo>()
  for (const jt of jobTitles) {
    const firstLink = jt.departments[0]
    if (firstLink) {
      const dept = firstLink.department
      map.set(jt.name.trim().toLowerCase(), {
        id: dept.id,
        name: dept.name,
        code: dept.code
      })
    }
  }
  return map
}

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

  const [result, titleToDeptMap] = await Promise.all([
    employeeService.getAllEmployees(filters, pagination),
    buildTitleToDeptMap()
  ])

  // Transform legacy schema to new API contract with department lookup
  const transformedItems = transformEmployees(result.items, titleToDeptMap)

  const paginationData = calculatePagination(page, limit, result.total)

  sendPaginated(reply, transformedItems, paginationData)
}

export async function getById(
  request: FastifyRequest<{ Params: IdParam }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params

  const [employee, titleToDeptMap] = await Promise.all([
    employeeService.getEmployeeById(id),
    buildTitleToDeptMap()
  ])

  // Transform legacy schema to new API contract with department lookup
  const transformedEmployee = transformEmployee(employee, titleToDeptMap)

  sendSuccess(reply, transformedEmployee)
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
