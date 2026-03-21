import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

export const ObsQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  cluster: Type.Optional(Type.String())
})

export type ObsQuery = Static<typeof ObsQuerySchema>

export const CreateObsBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 255 }),
  cluster: Type.Optional(Type.String({ maxLength: 50 })),
  description: Type.Optional(Type.String())
})

export type CreateObsBody = Static<typeof CreateObsBodySchema>

export const UpdateObsBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  cluster: Type.Optional(Type.String({ maxLength: 50 })),
  description: Type.Optional(Type.String())
})

export type UpdateObsBody = Static<typeof UpdateObsBodySchema>
