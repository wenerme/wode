import { RequiredEntityData } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { Errors, randomUUID } from '@wener/utils';
import dayjs from 'dayjs';
import { AccessTokenEntity } from '@/foundation/Auth/entity/AccessTokenEntity';
import { CustomBaseEntityService } from '@/foundation/services/CustomBaseEntityService';
import { UserEntity } from '@/foundation/User/entity/UserEntity';
import { UserService } from '@/foundation/User/UserService';

@Injectable()
export class AccessTokenService extends CustomBaseEntityService<AccessTokenEntity> {
  constructor(
    @Inject(MikroORM) protected readonly orm: MikroORM,
    @Inject(UserService) protected readonly us: UserService,
  ) {
    super(orm, AccessTokenEntity);
  }

  async createLoginToken({ data, remember }: CreateAccessTokenRequest) {
    let expiresIn = 60 * 30; // 30m
    if (remember) {
      expiresIn = 60 * 60 * 24 * 15; // 15d
    }

    const token = this.repo.create({
      grantType: 'manual',
      tokenType: 'Bearer',
      accessToken: randomUUID(),
      sessionId: randomUUID(),
      expiresIn,
      expiresAt: dayjs().add(expiresIn, 'seconds').toDate(),
      refreshToken: randomUUID(),
      refreshExpiresIn: 60 * 60 * 24 * 30, // 30d
      refreshExpiresAt: dayjs().add(30, 'd').toDate(),
      ...data,
    } as RequiredEntityData<AccessTokenEntity>);

    await this.em.persistAndFlush(token);

    return token;
  }

  async resolveAccessToken({ accessToken, refreshToken, refresh, refreshExpiresIn }: ResolveAccessTokenRequest) {
    const { repo: accessTokenRepo } = this;

    let token = await accessTokenRepo.findOne(
      {
        accessToken,
      },
      {
        // cache: 100, // 1min
      },
    );

    token = Errors.Unauthorized.require(token, 'invalid token');

    switch (refresh || 'auto') {
      case 'auto':
        refreshExpiresIn ||= 5 * 60; // 5min
        break;
      case 'now':
        refreshExpiresIn ||= 1 * 60; // 1min
        break;
      default:
        refreshExpiresIn = 0;
    }
    let refreshed = false;
    if (refreshExpiresIn && refreshToken) {
      Errors.Unauthorized.check(token.refreshToken === refreshToken, 'refresh token invalid');
      Errors.Unauthorized.check(dayjs().isBefore(token.refreshExpiresAt), 'refresh token expired');

      if (dayjs().add(refreshExpiresIn, 'seconds').isAfter(token.expiresAt)) {
        token.expiresAt = dayjs()
          .add(token.expiresIn || 60 * 30, 'seconds')
          .toDate();
        token.refreshCount++;
        refreshed = true;
      }
    }

    if (token.expiresAt) {
      Errors.Unauthorized.check(dayjs().isBefore(token.expiresAt), 'token expired');
    }

    let subject: UserEntity | undefined;
    if (token.subjectType === 'User' && token.subjectId) {
      subject = await this.us.get({ id: token.subjectId });
    }

    if (!token.lastUsedAt || dayjs().diff(token.lastUsedAt, 'minute') > 5) {
      token.lastUsedAt = new Date();
    }

    await this.em.persistAndFlush(token);
    return {
      accessToken: token,
      token,
      subject,
      refreshed,
    };
  }

  async rotateToken({ accessToken, refreshToken }: { accessToken: string; refreshToken: string }) {
    const { repo: accessTokenRepo, em, log } = this;
    let token = await accessTokenRepo.findOne({
      accessToken,
    });
    token = Errors.Unauthorized.require(token, 'invalid token');
    if (token.expiresAt) {
      if (!dayjs().add(5, 'minutes').isAfter(token.expiresAt)) {
        return {
          token: token,
        };
      }
    }
    Errors.Unauthorized.check(token.refreshToken === refreshToken, 'refresh token invalid');
    Errors.Unauthorized.check(dayjs().isBefore(token.refreshExpiresAt), 'refresh token expired');

    const {
      tid,
      subjectId,
      subjectType,
      grantType,
      tokenType,
      expiresIn,
      refreshExpiresIn,
      refreshExpiresAt,
      sessionId,
    } = token;

    // 避免旧的 Token 立即失效
    const next = accessTokenRepo.create({
      tid,
      subjectId,
      subjectType,
      grantType,
      tokenType,
      expiresIn,
      refreshExpiresIn,
      refreshExpiresAt,
      refreshToken,
      sessionId,
      expiresAt: dayjs()
        .add(expiresIn || 60 * 30, 'seconds')
        .toDate(),
      accessToken: randomUUID(),
    });
    // expire last one in 5min
    token.expiresAt = dayjs().add(5, 'minutes').toDate();
    await em.persistAndFlush([next, token]);
    return {
      last: token,
      token: next,
    };
  }
}

export interface CreateAccessTokenRequest {
  data: Partial<RequiredEntityData<AccessTokenEntity>>;
  remember?: boolean;
  /*
  tid: z.string().optional(),
  subjectId: z.string(),
  subjectType: z.string(),
  sessionId: z.string().optional(),
  clientId: z.string().optional(),
  grantType: z.string().optional(),
  tokenType: z.string().optional(),
  scopes: z.string().array().optional(),
  expiresAt: z.date().optional(),
  expiresIn: z.coerce.number().optional(),
  revokedAt: z.coerce.date().optional(),
  refreshToken: z.string().optional(),
  refreshExpiresIn: z.coerce.number().optional(),
  refreshExpiresAt: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional(),
   */
}

interface ResolveAccessTokenRequest {
  accessToken: string;
  refreshToken?: string;
  refresh?: 'auto' | 'now';
  refreshExpiresIn?: number;
}
