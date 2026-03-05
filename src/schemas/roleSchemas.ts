import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

export const RoleQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String())
})

export type RoleQuery = Static<typeof RoleQuerySchema>

export const CreateRoleBodySchema = Type.Object({
  roleName: Type.String({ minLength: 1, maxLength: 45 })
})

export type CreateRoleBody = Static<typeof CreateRoleBodySchema>

export const UpdateRoleBodySchema = Type.Object({
  roleName: Type.String({ minLength: 1, maxLength: 45 })
})

export type UpdateRoleBody = Static<typeof UpdateRoleBodySchema>

export const RoleIdParamSchema = Type.Object({
  id: Type.Integer({ minimum: 1 })
})

export type RoleIdParam = Static<typeof RoleIdParamSchema>
