import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

export const DivisionQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  description: Type.Optional(Type.String())
})

export type DivisionQuery = Static<typeof DivisionQuerySchema>

export const CreateDivisionBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  code: Type.Optional(Type.String({ maxLength: 50 })),
  description: Type.Optional(Type.String())
})

export type CreateDivisionBody = Static<typeof CreateDivisionBodySchema>

export const UpdateDivisionBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  code: Type.Optional(Type.String({ maxLength: 50 })),
  description: Type.Optional(Type.String())
})

export type UpdateDivisionBody = Static<typeof UpdateDivisionBodySchema>
