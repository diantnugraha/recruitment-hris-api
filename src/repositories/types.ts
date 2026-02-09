export class Success<T> {
  readonly value: T

  constructor(value: T) {
    this.value = value
  }

  isSuccess(): this is Success<T> {
    return true
  }

  isFailure(): this is Failure {
    return false
  }

  getValue(): T {
    return this.value
  }
}

export class Failure {
  readonly error: string

  constructor(error: string) {
    this.error = error
  }

  isSuccess(): this is Success<never> {
    return false
  }

  isFailure(): this is Failure {
    return true
  }

  getError(): string {
    return this.error
  }
}

export type RepositoryResult<T> = Success<T> | Failure

export function success<T>(value: T): Success<T> {
  return new Success(value)
}

export function failure(error: string): Failure {
  return new Failure(error)
}
