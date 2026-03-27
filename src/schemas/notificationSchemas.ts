import { Type } from '@sinclair/typebox'

export const notificationQuerySchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  type: Type.Optional(Type.String()),
})

export const notificationIdParamSchema = Type.Object({
  id: Type.Number(),
})
