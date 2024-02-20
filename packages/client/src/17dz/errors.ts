export class UnauthenticatedError extends Error {
  constructor(message: string) {
    super(message);
  }
}
