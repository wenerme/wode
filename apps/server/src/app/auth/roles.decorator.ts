import { SetMetadata } from '@nestjs/common';
import { type Role } from './role.enum';

export const AUTH_ROLES_KEY = 'auth.roles';
export const Roles = (...roles: Role[]) => SetMetadata(AUTH_ROLES_KEY, roles);
