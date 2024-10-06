export class UnauthenticatedError extends Error {
  code?: string;

  constructor(message: string) {
    super(message);
  }
}
