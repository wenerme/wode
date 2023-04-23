import { FastifyRequest } from 'fastify';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthSubject } from './AuthSubject';
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
    let subject: AuthSubject | undefined;
    if (token && process.env.ADMIN_SECRET === token) {
      subject = {
        admin: true,
        roles: [Role.User, Role.Admin, Role.SystemAdmin],
      } as AuthSubject;
    }
    if (subject) {
      req.user = subject;
    }
    // console.log(`Subject token:${token}`, subject);
    return true;
  }

  private extractTokenFromHeader(req: FastifyRequest['raw']): string | undefined {
    const [type, token] = req.headers.authorization?.trim().split(' ', 2) ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
