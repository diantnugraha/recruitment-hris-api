import { Type, type Static } from '@sinclair/typebox'

import { PaginationQuerySchema } from './common.js'
import {
  EMPLOYEE_STATUS,
  EMPLOYEE_GENDER,
  EMPLOYEE_MARITAL_STATUS
} from '../constants/employeeConstants.js'

export const EmployeeStatusSchema = Type.Union([
  Type.Literal(EMPLOYEE_STATUS.PROBATION),
  Type.Literal(EMPLOYEE_STATUS.CONTRACT),
  Type.Literal(EMPLOYEE_STATUS.PERMANENT),
  Type.Literal(EMPLOYEE_STATUS.RESIGNED)
])

export const EmployeeGenderSchema = Type.Union([
  Type.Literal(EMPLOYEE_GENDER.MALE),
  Type.Literal(EMPLOYEE_GENDER.FEMALE)
])

export const EmployeeMaritalStatusSchema = Type.Union([
  Type.Literal(EMPLOYEE_MARITAL_STATUS.SINGLE),
  Type.Literal(EMPLOYEE_MARITAL_STATUS.MARRIED),
  Type.Literal(EMPLOYEE_MARITAL_STATUS.DIVORCED),
  Type.Literal(EMPLOYEE_MARITAL_STATUS.WIDOWED)
])

export const EmployeeQuerySchema = Type.Object({
  ...PaginationQuerySchema.properties,
  name: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
  status: Type.Optional(EmployeeStatusSchema),
  gender: Type.Optional(EmployeeGenderSchema),
  location: Type.Optional(Type.String()),
  business_unit: Type.Optional(Type.String())
})

export type EmployeeQuery = Static<typeof EmployeeQuerySchema>

export const CreateEmployeeBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  nickname: Type.Optional(Type.String({ maxLength: 50 })),
  email: Type.Optional(Type.String({ format: 'email', maxLength: 100 })),
  contact: Type.Optional(Type.String({ maxLength: 50 })),
  gender: Type.Optional(EmployeeGenderSchema),
  status: Type.Optional(EmployeeStatusSchema),
  title: Type.Optional(Type.String({ maxLength: 100 })),
  location: Type.Optional(Type.String({ maxLength: 100 })),
  business_unit: Type.Optional(Type.String({ maxLength: 100 })),
  extension: Type.Optional(Type.String({ maxLength: 50 })),
  join_date: Type.Optional(Type.String({ format: 'date' })),
  birth_date: Type.Optional(Type.String({ format: 'date' })),
  permanent_date: Type.Optional(Type.String({ format: 'date' })),
  superior_id: Type.Optional(Type.Integer({ minimum: 0 })),
  marital_status: Type.Optional(EmployeeMaritalStatusSchema),
  nik: Type.Optional(Type.String({ maxLength: 45 })),
  address: Type.Optional(Type.String({ maxLength: 255 })),
  religion: Type.Optional(Type.String({ maxLength: 50 })),
  ethnic: Type.Optional(Type.String({ maxLength: 50 })),
  mother_name: Type.Optional(Type.String({ maxLength: 100 })),
  father_name: Type.Optional(Type.String({ maxLength: 100 })),
  spouse_name: Type.Optional(Type.String({ maxLength: 100 })),
  emergency_name: Type.Optional(Type.String({ maxLength: 200 })),
  emergency_relation: Type.Optional(Type.String({ maxLength: 45 })),
  emergency_phone: Type.Optional(Type.String({ maxLength: 45 }))
})

export type CreateEmployeeBody = Static<typeof CreateEmployeeBodySchema>

export const UpdateEmployeeBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  nickname: Type.Optional(Type.String({ maxLength: 50 })),
  email: Type.Optional(Type.String({ format: 'email', maxLength: 100 })),
  contact: Type.Optional(Type.String({ maxLength: 50 })),
  gender: Type.Optional(EmployeeGenderSchema),
  status: Type.Optional(EmployeeStatusSchema),
  title: Type.Optional(Type.String({ maxLength: 100 })),
  location: Type.Optional(Type.String({ maxLength: 100 })),
  business_unit: Type.Optional(Type.String({ maxLength: 100 })),
  extension: Type.Optional(Type.String({ maxLength: 50 })),
  join_date: Type.Optional(Type.String({ format: 'date' })),
  birth_date: Type.Optional(Type.String({ format: 'date' })),
  permanent_date: Type.Optional(Type.String({ format: 'date' })),
  superior_id: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  marital_status: Type.Optional(EmployeeMaritalStatusSchema),
  nik: Type.Optional(Type.String({ maxLength: 45 })),
  address: Type.Optional(Type.String({ maxLength: 255 })),
  religion: Type.Optional(Type.String({ maxLength: 50 })),
  ethnic: Type.Optional(Type.String({ maxLength: 50 })),
  mother_name: Type.Optional(Type.String({ maxLength: 100 })),
  father_name: Type.Optional(Type.String({ maxLength: 100 })),
  spouse_name: Type.Optional(Type.String({ maxLength: 100 })),
  emergency_name: Type.Optional(Type.String({ maxLength: 200 })),
  emergency_relation: Type.Optional(Type.String({ maxLength: 45 })),
  emergency_phone: Type.Optional(Type.String({ maxLength: 45 }))
})

export type UpdateEmployeeBody = Static<typeof UpdateEmployeeBodySchema>
