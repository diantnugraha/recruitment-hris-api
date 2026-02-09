import { Type, type Static } from '@sinclair/typebox'

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 })
})

export type LoginBody = Static<typeof LoginBodySchema>

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 }),
  name: Type.String({ minLength: 1 })
})

export type RegisterBody = Static<typeof RegisterBodySchema>

export const UserResponseSchema = Type.Object({
  id: Type.Integer(),
  email: Type.String(),
  name: Type.String(),
  role: Type.String(),
  created_at: Type.String(),
  updated_at: Type.String()
})

export type UserResponse = Static<typeof UserResponseSchema>

export const AuthResponseSchema = Type.Object({
  user: UserResponseSchema,
  token: Type.String()
})

export type AuthResponse = Static<typeof AuthResponseSchema>
