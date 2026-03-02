import { AppError } from './AppError.js'

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message, 'BAD_REQUEST')
  }
}
