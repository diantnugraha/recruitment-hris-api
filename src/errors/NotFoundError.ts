import { AppError } from './AppError.js'

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message, 'NOT_FOUND')
  }
}
