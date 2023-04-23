import { type FastifyRequest } from 'fastify';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { type AuthPrincipal } from './AuthPrincipal';
import { Role } from './role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(req);
    // if (!token) {
    //   throw new UnauthorizedException();
    // }
    let principal: AuthPrincipal | undefined;
    if (token && process.env.ADMIN_SECRET === token) {
      principal = {
        admin: true,
        roles: [Role.User, Role.Admin, Role.SystemAdmin],
      } as AuthPrincipal;
    }
    if (principal) {
      req.user = principal;
    }
    // console.log(`Subject token:${token}`, subject);
    return true;
  }

  private extractTokenFromHeader(req: FastifyRequest['raw']): string | undefined {
    const [type, token] = req.headers.authorization?.trim().split(' ', 2) ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
