import { Type, type Static } from '@sinclair/typebox'

export const PaginationSchema = Type.Object({
  page: Type.Integer(),
  limit: Type.Integer(),
  total: Type.Integer(),
  totalPages: Type.Integer()
})

export type Pagination = Static<typeof PaginationSchema>

export const SuccessResponseSchema = <T extends ReturnType<typeof Type.Any>>(dataSchema: T) =>
  Type.Object({
    success: Type.Literal(true),
    data: dataSchema,
    message: Type.Optional(Type.String())
  })

export const PaginatedResponseSchema = <T extends ReturnType<typeof Type.Any>>(dataSchema: T) =>
  Type.Object({
    success: Type.Literal(true),
    data: Type.Array(dataSchema),
    pagination: PaginationSchema
  })

export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  message: Type.String(),
  code: Type.Optional(Type.String())
})

export type ErrorResponse = Static<typeof ErrorResponseSchema>
