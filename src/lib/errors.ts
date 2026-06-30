export class SupabaseError extends Error {
  readonly cause: unknown

  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'SupabaseError'
    this.cause = cause
  }
}
