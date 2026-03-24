import { Type, type Static } from '@sinclair/typebox'

export const CandidateLoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 })
})

export type CandidateLoginBody = Static<typeof CandidateLoginBodySchema>

export const CandidateProfileUpdateSchema = Type.Object({
  fullname: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  mobilePhone: Type.Optional(Type.String()),
  birthPlace: Type.Optional(Type.String()),
  birthDate: Type.Optional(Type.String()),
  religion: Type.Optional(Type.String()),
  ethnicGroup: Type.Optional(Type.String()),
  idNo: Type.Optional(Type.String()),
  taxId: Type.Optional(Type.String()),
  bpjsId: Type.Optional(Type.String()),
  citizenship: Type.Optional(Type.String()),
  marritalStatus: Type.Optional(Type.String()),
  residentStatus: Type.Optional(Type.String()),
  domicileAddress: Type.Optional(Type.String()),
  drivingLicense: Type.Optional(Type.String()),
  uniformShirtSize: Type.Optional(Type.String()),
  uniformPantsSize: Type.Optional(Type.String()),
})

export type CandidateProfileUpdate = Static<typeof CandidateProfileUpdateSchema>

export const CandidateResponseSchema = Type.Object({
  id: Type.Integer(),
  fullname: Type.String(),
  email: Type.String(),
  address: Type.String(),
  resident_status: Type.String(),
  birth_place: Type.String(),
  birth_date: Type.Union([Type.String(), Type.Null()]),
  religion: Type.String(),
  ethnic_group: Type.String(),
  id_no: Type.String(),
  tax_id: Type.String(),
  bpjs_id: Type.String(),
  citizenship: Type.String(),
  marrital_status: Type.String(),
  gender: Type.String(),
  mobile_phone: Type.String(),
  domicile_address: Type.String(),
  driving_license: Type.String(),
  uniform_shirt_size: Type.String(),
  uniform_pants_size: Type.String(),
  verify: Type.String(),
  agreement_accepted_at: Type.Union([Type.String(), Type.Null()]),
  agreement_version: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.Union([Type.String(), Type.Null()]),
  updated_at: Type.Union([Type.String(), Type.Null()]),
  candidate_code: Type.Union([Type.String(), Type.Null()]),
  job_title_name: Type.Union([Type.String(), Type.Null()]),
  is_submitted: Type.Boolean()
})

export type CandidateResponse = Static<typeof CandidateResponseSchema>

export const CandidateAuthResponseSchema = Type.Object({
  candidate: CandidateResponseSchema,
  token: Type.String()
})

export type CandidateAuthResponse = Static<typeof CandidateAuthResponseSchema>
