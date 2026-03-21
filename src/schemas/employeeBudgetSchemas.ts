import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'
import { MIN_BUDGET_YEAR, MAX_BUDGET_YEAR } from '../constants/employeeBudgetConstants.js'

export const EmployeeBudgetQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  department_id: Type.Optional(Type.Integer({ minimum: 1 })),
  year: Type.Optional(Type.Integer({ minimum: MIN_BUDGET_YEAR, maximum: MAX_BUDGET_YEAR }))
})

export type EmployeeBudgetQuery = Static<typeof EmployeeBudgetQuerySchema>

export const CreateEmployeeBudgetBodySchema = Type.Object({
  departmentId: Type.Integer({ minimum: 1 }),
  year: Type.Integer({ minimum: MIN_BUDGET_YEAR, maximum: MAX_BUDGET_YEAR }),
  technical: Type.Integer({ minimum: 0, default: 0 }),
  admin: Type.Integer({ minimum: 0, default: 0 }),
  document: Type.Optional(Type.String({ maxLength: 255 }))
})

export type CreateEmployeeBudgetBody = Static<typeof CreateEmployeeBudgetBodySchema>

export const UpdateEmployeeBudgetBodySchema = Type.Object({
  departmentId: Type.Optional(Type.Integer({ minimum: 1 })),
  year: Type.Optional(Type.Integer({ minimum: MIN_BUDGET_YEAR, maximum: MAX_BUDGET_YEAR })),
  technical: Type.Optional(Type.Integer({ minimum: 0 })),
  admin: Type.Optional(Type.Integer({ minimum: 0 })),
  document: Type.Optional(Type.String({ maxLength: 255 }))
})

export type UpdateEmployeeBudgetBody = Static<typeof UpdateEmployeeBudgetBodySchema>

export const CalculateBudgetQuerySchema = Type.Object({
  department_id: Type.Optional(Type.Integer({ minimum: 1 })),
  year: Type.Optional(Type.Integer({ minimum: MIN_BUDGET_YEAR, maximum: MAX_BUDGET_YEAR }))
})

export type CalculateBudgetQuery = Static<typeof CalculateBudgetQuerySchema>

export const SummaryQuerySchema = Type.Object({
  year: Type.Optional(Type.Integer({ minimum: MIN_BUDGET_YEAR, maximum: MAX_BUDGET_YEAR }))
})

export type SummaryQuery = Static<typeof SummaryQuerySchema>

export const RestBudgetQuerySchema = Type.Object({
  department_id: Type.Integer({ minimum: 1 }),
  year: Type.Optional(Type.Integer({ minimum: MIN_BUDGET_YEAR, maximum: MAX_BUDGET_YEAR }))
})

export type RestBudgetQuery = Static<typeof RestBudgetQuerySchema>
