export class RemoteMethodNotImplemented extends Error {
  constructor(methodName = '') {
    super(`Remote method "${methodName}" not implement`);
  }
}
