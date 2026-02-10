import { Type, type Static } from '@sinclair/typebox'

import { DEPARTMENT_CATEGORY_VALUES } from '../constants/departmentConstants.js'
import { PaginationQuerySchema } from './common.js'

export const DepartmentCategorySchema = Type.Union(
  DEPARTMENT_CATEGORY_VALUES.map((value) => Type.Literal(value))
)

export const DepartmentQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  obs_id: Type.Optional(Type.Integer({ minimum: 1 })),
  division_id: Type.Optional(Type.Integer({ minimum: 1 })),
  category: Type.Optional(DepartmentCategorySchema)
})

export type DepartmentQuery = Static<typeof DepartmentQuerySchema>

export const CreateDepartmentBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  code: Type.String({ minLength: 1, maxLength: 100 }),
  obsId: Type.Integer({ minimum: 1 }),
  divisionId: Type.Optional(Type.Integer({ minimum: 1 })),
  category: DepartmentCategorySchema,
  description: Type.Optional(Type.String())
})

export type CreateDepartmentBody = Static<typeof CreateDepartmentBodySchema>

export const UpdateDepartmentBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  code: Type.String({ minLength: 1, maxLength: 100 }),
  obsId: Type.Integer({ minimum: 1 }),
  divisionId: Type.Optional(Type.Integer({ minimum: 1 })),
  category: DepartmentCategorySchema,
  description: Type.Optional(Type.String())
})

export type UpdateDepartmentBody = Static<typeof UpdateDepartmentBodySchema>
