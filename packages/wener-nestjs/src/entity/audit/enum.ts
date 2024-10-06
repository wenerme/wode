export enum EntityAuditAction {
  View = 'entity.view',
  Create = 'entity.create',
  Upsert = 'entity.upsert',
  Update = 'entity.update',
  Patch = 'entity.patch',
  Delete = 'entity.delete',
  Undelete = 'entity.undelete',
  Purge = 'entity.purge',
  Change = 'entity.change',
}

export enum SystemAuditAction {
  Bootstrap = 'system.bootstrap',
  Shutdown = 'system.shutdown',
  UserLoginFailed = 'user.login.fail',
}

export enum UserAuditAction {
  LoginSuccess = 'user.login.success',
  Logout = 'user.logout',
  PasswordChange = 'user.password.change',
  PasswordReset = 'user.password.reset',
}
