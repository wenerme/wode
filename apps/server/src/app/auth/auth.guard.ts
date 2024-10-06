import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type FastifyRequest } from 'fastify';
import { type AuthPrincipal } from './AuthPrincipal';
import { getRequest } from './getRequest';
import { AUTH_PUBLIC_KEY } from './public.decorator';
import { Role } from './role.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  @Inject(Reflector) protected readonly reflector!: Reflector;
  private readonly log = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { log } = this;
    const isPublic = this.reflector.getAllAndOverride<boolean>(AUTH_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = getRequest(context);

    if ('user' in req && req.user) {
      return true;
    }

    const required = true;

    const token = this.extractTokenFromHeader(req);
    if (!token && required) {
      log.debug(`Missing token`, req.headers);
      throw new UnauthorizedException();
    }
    let principal: AuthPrincipal | undefined;
    if (token) {
      if (process.env.ADMIN_SECRET === token) {
        principal = {
          admin: true,
          roles: [Role.User, Role.Admin, Role.SystemAdmin],
        };
      }
      if (!principal) {
        try {
          principal = await this.handleToken({ token });
        } catch (e) {
          log.error(`handleToken: ${e}`);
        }
      }
      if (principal) {
        req.principal = principal;
        if (principal.user) {
          req.user = principal.user;
        }
      }
    }
    if (!principal && token && required) {
      log.debug(`Invalid token`);
      throw new UnauthorizedException();
    }
    return true;
  }

  protected async handleToken(o: { token: string }): Promise<AuthPrincipal | undefined> {
    return undefined;
  }

  private extractTokenFromHeader(req: FastifyRequest['raw']): string | undefined {
    const [type, token] = req.headers.authorization?.trim().split(' ', 2) ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
