import type { FastifyInstance } from 'fastify'

import { healthRoutes } from './healthRoutes.js'
import { authRoutes } from './authRoutes.js'
import { userRestRoutes } from './userRestRoutes.js'
import { obsRoutes } from './obsRoutes.js'
import { divisionRoutes } from './divisionRoutes.js'
import { departmentRoutes } from './departmentRoutes.js'
import { jobLevelRoutes } from './jobLevelRoutes.js'
import { jobTitleRoutes } from './jobTitleRoutes.js'

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(userRestRoutes, { prefix: '/v1/user-rest' })
  await app.register(obsRoutes, { prefix: '/v1/obs' })
  await app.register(divisionRoutes, { prefix: '/v1/division' })
  await app.register(departmentRoutes, { prefix: '/v1/department' })
  await app.register(jobLevelRoutes, { prefix: '/v1/job-level' })
  await app.register(jobTitleRoutes, { prefix: '/v1/job-title' })
}
