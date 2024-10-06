import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Errors } from '@wener/utils';
import { UserAuditAction, writeUserAuditLog } from '@/foundation/Audit';
import { AccessTokenService } from '@/foundation/Auth/AccessTokenService';
import { AccessTokenEntity } from '@/foundation/Auth/entity';
import { UserEntity } from '@/foundation/User/entity/UserEntity';
import { UserService } from '@/foundation/User/UserService';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @Inject(EntityManager) private readonly em: EntityManager,
    @Inject(UserService) private readonly us: UserService,
    @Inject(AccessTokenService) private readonly ats: AccessTokenService,
    @InjectRepository(UserEntity) private readonly userRepo: EntityRepository<UserEntity>,
    @InjectRepository(AccessTokenEntity) private readonly accessTokenRepo: EntityRepository<AccessTokenEntity>,
  ) {}

  async logout(o: { sessionId: string }) {
    const { accessTokenRepo, em } = this;
    const entities = await accessTokenRepo.find({
      sessionId: o.sessionId,
      subjectType: 'User', // only user can log out
    });
    if (entities.length === 0) {
      writeUserAuditLog({
        sessionId: o.sessionId,
        action: UserAuditAction.Logout,
        em,
        context: {
          userId: entities[0].subjectId,
        },
      });
    }

    await em.removeAndFlush(entities);
    return {
      count: entities.length,
    };
  }

  async login({ username, password }: { username: string; password: string }) {
    let user = await this.us.repo.findOne({ loginName: username });

    Errors.NotFound.check(user, '用户不存在');
    Errors.Forbidden.check(user.isPasswordMatch(password), '密码错误');

    const token = await this.ats.createLoginToken({
      data: {
        subjectId: user.id,
        subjectType: 'User',
        grantType: 'password',
      },
      remember: true,
    });

    return {
      user,
      token,
    };
  }

  resolveAccessToken({ accessToken, refreshToken }: { accessToken?: string; refreshToken?: string }) {
    Errors.Forbidden.check(accessToken, 'invalid token');
    return this.ats.resolveAccessToken({ accessToken, refreshToken });
  }

  async changePassword(req: {
    userId: string;
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }) {
    Errors.BadRequest.check(req.password === req.passwordConfirmation, '密码不一致');
    Errors.BadRequest.check(req.currentPassword !== req.password, '新密码不能和旧密码相同');

    const user = await this.us.get({ id: req.userId });
    Errors.BadRequest.check(await user.isPasswordMatch(req.currentPassword), '密码错误');

    await user.setPassword(req.password);

    // fixme invalid token

    await this.em.persistAndFlush(user);
    return {
      user,
    };
  }
}
