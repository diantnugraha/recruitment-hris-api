import { Type, type Static } from '@sinclair/typebox'

export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  search: Type.Optional(Type.String())
})

export type PaginationQuery = Static<typeof PaginationQuerySchema>

export const IdParamSchema = Type.Object({
  id: Type.Integer({ minimum: 1 })
})

export type IdParam = Static<typeof IdParamSchema>
