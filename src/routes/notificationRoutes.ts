import type { FastifyInstance } from 'fastify'
import * as notificationController from '../controllers/notificationController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { enrichUserContext } from '../middlewares/enrichUserContext.js'
import { notificationQuerySchema, notificationIdParamSchema } from '../schemas/notificationSchemas.js'

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', enrichUserContext)

  // Static routes FIRST to avoid conflicts with parametric routes
  app.get('/unread-count', notificationController.getUnreadCount)
  app.put('/read-all', notificationController.markAllAsRead)

  app.get('/', {
    schema: { querystring: notificationQuerySchema },
    handler: notificationController.getAll,
  })

  // Parametric route LAST
  app.put<{ Params: { id: number } }>('/:id/read', {
    schema: { params: notificationIdParamSchema },
    handler: notificationController.markAsRead,
  })
}
