import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

// Category values (kept from legacy)
export const DepartmentCategorySchema = Type.Union([
  Type.Literal('Non Profit Center'),
  Type.Literal('Profit Center')
])

export const DepartmentQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  division_id: Type.Optional(Type.Integer({ minimum: 1 })),
  category: Type.Optional(DepartmentCategorySchema),
  is_management: Type.Optional(Type.Boolean())
})

export type DepartmentQuery = Static<typeof DepartmentQuerySchema>

export const CreateDepartmentBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  code: Type.String({ minLength: 1, maxLength: 100 }),
  divisionId: Type.Integer({ minimum: 1 }),
  managerId: Type.Optional(Type.Integer({ minimum: 1 })),
  category: Type.Optional(DepartmentCategorySchema),
  description: Type.Optional(Type.String())
})

export type CreateDepartmentBody = Static<typeof CreateDepartmentBodySchema>

export const UpdateDepartmentBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  code: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  divisionId: Type.Optional(Type.Integer({ minimum: 1 })),
  managerId: Type.Optional(Type.Integer({ minimum: 1 })),
  category: Type.Optional(DepartmentCategorySchema),
  description: Type.Optional(Type.String())
})

export type UpdateDepartmentBody = Static<typeof UpdateDepartmentBodySchema>

// Schema for assigning manager
export const AssignManagerBodySchema = Type.Object({
  employeeId: Type.Integer({ minimum: 1 })
})

export type AssignManagerBody = Static<typeof AssignManagerBodySchema>
