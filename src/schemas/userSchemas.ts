import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'

// User Query Schema
export const UserQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  orderby: Type.Optional(Type.Union([Type.Literal('name'), Type.Literal('code')])),
  direction: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
  id: Type.Optional(Type.Integer({ minimum: 1 })),
  display_name: Type.Optional(Type.String()),
  email: Type.Optional(Type.String())
})

export type UserQuery = Static<typeof UserQuerySchema>

// Create User Body Schema
export const CreateUserBodySchema = Type.Object({
  displayName: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email', maxLength: 100 }),
  name: Type.Optional(Type.String({ maxLength: 100 })),
  password: Type.Optional(Type.String({ minLength: 8 })),
  roleId: Type.Optional(Type.Integer({ minimum: 1 })),
  employeeId: Type.Optional(Type.Integer({ minimum: 1 })),
  superiorId: Type.Optional(Type.Integer({ minimum: 1 }))
})

export type CreateUserBody = Static<typeof CreateUserBodySchema>

// Update User Body Schema
export const UpdateUserBodySchema = Type.Object({
  displayName: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email', maxLength: 100 }),
  name: Type.Optional(Type.String({ maxLength: 100 })),
  newPassword: Type.Optional(Type.String({ minLength: 8 })),
  roleId: Type.Optional(Type.Integer({ minimum: 1 })),
  employeeId: Type.Optional(Type.Integer({ minimum: 1 })),
  superiorId: Type.Optional(Type.Integer({ minimum: 1 }))
})

export type UpdateUserBody = Static<typeof UpdateUserBodySchema>

// Update Password Body Schema
export const UpdatePasswordBodySchema = Type.Object({
  currentPassword: Type.String({ minLength: 1 }),
  newPassword: Type.String({ minLength: 8 })
})

export type UpdatePasswordBody = Static<typeof UpdatePasswordBodySchema>

// User Response Schema (for documentation)
export const UserResponseSchema = Type.Object({
  id: Type.Integer(),
  name: Type.Union([Type.String(), Type.Null()]),
  email: Type.String(),
  displayName: Type.String(),
  roleId: Type.Integer(),
  employeeId: Type.Union([Type.Integer(), Type.Null()]),
  superiorId: Type.Union([Type.Integer(), Type.Null()]),
  emailVerifiedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
  role: Type.Optional(
    Type.Object({
      roleId: Type.Integer(),
      roleName: Type.Union([Type.String(), Type.Null()])
    })
  ),
  employee: Type.Optional(
    Type.Union([
      Type.Object({
        employeeId: Type.Integer(),
        employeeName: Type.Union([Type.String(), Type.Null()]),
        employeeEmail: Type.Union([Type.String(), Type.Null()])
      }),
      Type.Null()
    ])
  ),
  files: Type.Optional(
    Type.Array(
      Type.Object({
        id: Type.Integer(),
        name: Type.String(),
        type: Type.String(),
        location: Type.String()
      })
    )
  )
})

export type UserResponse = Static<typeof UserResponseSchema>
