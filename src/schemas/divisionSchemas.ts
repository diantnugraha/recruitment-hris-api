import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

export const DivisionQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  obs_id: Type.Optional(Type.Integer({ minimum: 1 })),
  is_management: Type.Optional(Type.Boolean())
})

export type DivisionQuery = Static<typeof DivisionQuerySchema>

export const CreateDivisionBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  code: Type.Optional(Type.String({ maxLength: 50 })),
  obsId: Type.Optional(Type.Integer({ minimum: 1 })),
  isManagement: Type.Optional(Type.Boolean({ default: false })),
  headOfDivisionId: Type.Optional(Type.Integer({ minimum: 1 })),
  deputyHeadId: Type.Optional(Type.Integer({ minimum: 1 })),
  description: Type.Optional(Type.String())
})

export type CreateDivisionBody = Static<typeof CreateDivisionBodySchema>

export const UpdateDivisionBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  code: Type.Optional(Type.String({ maxLength: 50 })),
  obsId: Type.Optional(Type.Integer({ minimum: 1 })),
  isManagement: Type.Optional(Type.Boolean()),
  headOfDivisionId: Type.Optional(Type.Integer({ minimum: 1 })),
  deputyHeadId: Type.Optional(Type.Integer({ minimum: 1 })),
  description: Type.Optional(Type.String())
})

export type UpdateDivisionBody = Static<typeof UpdateDivisionBodySchema>

// Schema for assigning head/deputy
export const AssignHeadBodySchema = Type.Object({
  employeeId: Type.Integer({ minimum: 1 })
})

export type AssignHeadBody = Static<typeof AssignHeadBodySchema>

// Schema for removing head/deputy (set to null)
export const RemoveHeadBodySchema = Type.Object({})

export type RemoveHeadBody = Static<typeof RemoveHeadBodySchema>
