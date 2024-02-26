import { AssignOptions, EntityManager, wrap } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import {
  AuthVerificationTokenEntity,
  UserAccountEntity,
  UserEntity,
  UserSessionEntity,
} from '@wener/server/src/entity/UserEntity';
import { MaybePromise } from '@wener/utils';
import { md5 } from '@wener/utils/server';
import { NextAuthOptions } from 'next-auth';
import { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from 'next-auth/adapters';
import { ProviderType } from 'next-auth/providers';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';

export function getNextAuthOptions(): NextAuthOptions {
  return {
    adapter: MikroOrmNextAuthAdapter(),
    debug: process.env.NODE_ENV === 'development',
    pages: {
      // signIn: '/auth/signin',
    },
    providers: [
      CredentialsProvider({
        id: 'credentials',
        name: 'Login by Password',
        credentials: {
          org: { label: '组织', type: 'text' },
          username: { label: '用户名', type: 'text' },
          password: { label: '密码', type: 'password' },
          token: { type: 'text' },
        },
        async authorize(credentials, req) {
          const { username, password } = CredentialsInput.parse(credentials);
          log.log(`authorize ${username}`);
          let em = getEntityManager();
          const user = await em.getRepository(UserEntity).findOneOrFail({
            loginName: username,
          });
          if (!(await isPasswordMatch(password, user))) {
            log.warn(`authorize ${username} password not match`);
            return null;
          }
          log.log(`authorize ${username} success`);
          return NextAuthAdapter.user.toAdapter(user);
        },
      }),
    ],
  };
}

const CredentialsInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
const log = new Logger('NextAuth');

async function isPasswordMatch(
  raw: string,
  {
    passwordMd5,
  }: {
    password?: string;
    passwordMd5?: string;
  },
) {
  if (passwordMd5) {
    return (await md5(raw)) === passwordMd5;
  }
  // todo
}

async function generateSalt(len: number = 10) {
  const { randomBytes } = await import('node:crypto');
  return randomBytes(Math.ceil(len / 2))
    .toString('hex')
    .substring(0, len);
}

async function encodePassword({
  iterations,
  algorithm,
  salt,
  password,
}: {
  algorithm: string;
  salt?: string;
  password: string;
  iterations?: number;
}) {
  iterations = iterations || 1;
  const { createHmac } = await import('node:crypto');
  salt ??= await generateSalt();
  try {
    let hash = password;
    for (let i = 0; i < iterations; ++i) {
      hash = createHmac(algorithm, salt).update(hash).digest('hex');
    }

    return algorithm + '$' + salt + '$' + iterations + '$' + hash;
  } catch (e) {
    throw new Error('Invalid message digest algorithm');
  }
}

function MikroOrmNextAuthAdapter({
  getEm = getEntityManager,
}: { getEm?: () => MaybePromise<EntityManager> } = {}): Adapter {
  const log = new Logger('MikroOrmNextAuthAdapter');
  const tx = async <R>(f: (em: EntityManager) => Promise<R>): Promise<R> => {
    let em = (await getEm()).fork();
    return em.transactional(() => f(em));
  };
  return {
    async createUser(data) {
      return tx(async (em) => {
        const user = NextAuthAdapter.user.fromAdapter(data);
        await em.persistAndFlush(user);
        return NextAuthAdapter.user.toAdapter(user);
      });
    },
    async getUser(id) {
      return tx(async (em) => {
        const user = await em.findOne(UserEntity, { id });
        if (!user) return null;
        return NextAuthAdapter.user.toAdapter(user);
      });
    },
    async getUserByEmail(email) {
      return tx(async (em) => {
        const user = await em.findOne(UserEntity, { email });
        if (!user) return null;
        return NextAuthAdapter.user.toAdapter(user);
      });
    },
    async getUserByAccount({ providerAccountId, provider: providerId }) {
      // fixme merge by eid
      return tx(async (em) => {
        const account = await em.findOne(UserAccountEntity, {
          providerId,
          providerAccountId,
        });
        if (!account) return null;
        const user = await em.findOne(UserEntity, { id: account.userId });
        if (!user) return null;
        return NextAuthAdapter.user.toAdapter(user);
      });
    },
    async updateUser(data) {
      return tx(async (em) => {
        const user = await em.findOne(UserEntity, { id: data.id });
        if (!user) throw new Error('User not found');
        NextAuthAdapter.user.fromAdapter(data, user, { mergeObjects: true });
        await em.persistAndFlush(user);

        return NextAuthAdapter.user.toAdapter(user);
      });
    },
    async deleteUser(id) {
      return tx(async (em) => {
        const user = await em.findOne(UserEntity, { id });
        if (!user) return null;
        await em.removeAndFlush(user);

        return NextAuthAdapter.user.toAdapter(user);
      });
    },
    async linkAccount(data) {
      return tx(async (em) => {
        const user = await em.findOne(UserEntity, { id: data.userId });
        if (!user) throw new Error('User not found');
        const account = NextAuthAdapter.account.fromAdapter(undefined, data);
        // console.log(`Link Account`, data)
        user.accounts.add(account);
        await em.persistAndFlush(user);

        return NextAuthAdapter.account.toAdapter(account);
      });
    },
    async unlinkAccount({ providerAccountId, provider: providerId }) {
      return tx(async (em) => {
        const account = await em.findOne(UserAccountEntity, {
          providerAccountId,
          providerId,
        });
        if (!account) throw new Error('Account not found');
        await em.removeAndFlush(account);

        return NextAuthAdapter.account.toAdapter(account);
      });
    },
    async getSessionAndUser(sessionToken) {
      return tx(async (em) => {
        const session = await em.findOne(UserSessionEntity, { sessionToken }, { populate: ['user'] });
        if (!session?.user) {
          log.warn(`session not found: ${sessionToken}`);
          return null;
        }

        return {
          user: NextAuthAdapter.user.toAdapter(session.user),
          session: NextAuthAdapter.session.toAdapter(session),
        };
      });
    },
    async createSession(data) {
      return tx(async (em) => {
        log.debug('createSession', data);
        const user = await em.findOne(UserEntity, { id: data.userId });
        if (!user) throw new Error('User not found');
        const session = NextAuthAdapter.session.fromAdapter(data, undefined);
        user.sessions.add(session);
        await em.persistAndFlush(user);

        return NextAuthAdapter.session.toAdapter(session);
      });
    },
    async updateSession(data) {
      return tx(async (em) => {
        log.debug('updateSession', data);
        const session = await em.findOne(UserSessionEntity, {
          sessionToken: data.sessionToken,
        });
        wrap(session).assign(data);
        if (!session) throw new Error('Session not found');
        await em.persistAndFlush(session);

        return NextAuthAdapter.session.toAdapter(session);
      });
    },
    async deleteSession(sessionToken) {
      return tx(async (em) => {
        const session = await em.findOne(UserSessionEntity, {
          sessionToken,
        });
        if (!session) return null;
        await em.removeAndFlush(session);

        return NextAuthAdapter.session.toAdapter(session);
      });
    },
    async createVerificationToken(data) {
      return tx(async (em) => {
        const verificationToken = NextAuthAdapter.token.fromAdapter(data, undefined);
        await em.persistAndFlush(verificationToken);
        return NextAuthAdapter.token.toAdapter(verificationToken);
      });
    },
    async useVerificationToken(params) {
      return tx(async (em) => {
        const verificationToken = await em.getRepository(AuthVerificationTokenEntity).findOne(params);
        if (!verificationToken) return null;
        await em.removeAndFlush(verificationToken);
        return NextAuthAdapter.token.toAdapter(verificationToken);
      });
    },
  };
}

declare module 'next-auth/adapters' {
  interface AdapterAccount {
    providerType?: string;
    providerClientId?: string;
    providerClientAppId?: string;
    expires_in?: number;
  }

  interface AdapterUser {
    eid?: string;
    phoneNumber?: string;
    phoneNumberVerified?: Date;
    displayName?: string;
    loginName?: string;
  }
}

const NextAuthAdapter = {
  token: {
    toAdapter(ent: AuthVerificationTokenEntity): VerificationToken {
      const { identifier, expiresAt: expires, token } = ent;
      return { identifier, expires, token };
    },
    fromAdapter(data: VerificationToken, ent: AuthVerificationTokenEntity = new AuthVerificationTokenEntity()) {
      const { identifier, expires: expiresAt, token } = data;
      ent.assign({
        identifier,
        expiresAt,
        token,
      });
      return ent;
    },
  },
  session: {
    fromAdapter(data: AdapterSession, ent: UserSessionEntity = new UserSessionEntity()) {
      const { userId, sessionToken, expires: expiresAt } = data;
      ent.assign({
        userId,
        sessionToken,
        expiresAt,
      });
      return ent;
    },
    toAdapter(ent: UserSessionEntity): AdapterSession {
      const { userId, sessionToken, expiresAt: expires } = ent;
      return {
        userId,
        sessionToken,
        expires,
      };
    },
  },
  user: {
    fromAdapter(data: Partial<AdapterUser>, ent: UserEntity = new UserEntity(), opts?: AssignOptions) {
      const { email, emailVerified, image, displayName, loginName, name, eid, phoneNumber, phoneNumberVerified } = data;
      ent.assign(
        {
          eid,
          email,
          emailVerified,
          photoUrl: image,
          displayName: displayName || name,
          loginName,
          phoneNumber,
          phoneNumberVerified,
          // raw: data,
        },
        opts,
      );
      return ent;
    },
    toAdapter(ent: UserEntity): AdapterUser {
      const { id, email = '', emailVerified, photoUrl, displayName, loginName } = ent;
      return {
        id,
        email,
        emailVerified: emailVerified ?? null,
        image: photoUrl,
        name: displayName,
        displayName,
        loginName,
      };
    },
  },
  account: {
    fromAdapter(ent: UserAccountEntity = new UserAccountEntity(), data: AdapterAccount, opts?: AssignOptions) {
      const {
        access_token: accessToken,
        id_token: idToken,
        provider: providerId,
        refresh_token: refreshToken,
        session_state: sessionState,
        token_type: tokenType,
        expires_at,
        expires_in,
        providerAccountId,
        providerType,
        providerClientId,
        providerClientAppId,
        type,
        scope,
      } = data;
      ent.assign({
        accessToken,
        expiresAt: toSQLTimestamp(expires_at),
        expiresIn: expires_in,
        idToken,
        providerId,
        providerType,
        providerClientId,
        providerClientAppId,
        providerAccountId,
        raw: data,
        refreshToken,
        refreshTokenExpiresAt: toSQLTimestamp(data.refresh_token_expires_at as number),
        sessionState,
        tokenType,
        type,
        scope,
      });
      return ent;
    },
    toAdapter(ent: UserAccountEntity): AdapterAccount {
      const {
        id,
        providerAccountId,
        providerType,
        providerClientId,
        providerClientAppId,
        type,
        scope,
        userId,
        expiresAt,
        refreshTokenExpiresAt,
        accessToken: access_token,
        idToken: id_token,
        providerId: provider,
        refreshToken: refresh_token,
        sessionState: session_state,
        tokenType: token_type,
        expiresIn,
      } = ent;
      return {
        access_token,
        expires_at: toUnixTimestamp(expiresAt),
        expires_in: expiresIn,
        id,
        id_token,
        provider,
        providerAccountId,
        providerType,
        providerClientId,
        providerClientAppId,
        refresh_token,
        refresh_token_expires_at: toUnixTimestamp(refreshTokenExpiresAt),
        scope,
        session_state,
        token_type,
        type: type as ProviderType,
        userId,
      };
    },
  },
};

function toSQLTimestamp(raw?: string | number | Date) {
  // invalid input syntax for type timestamp with time zone: "Invalid Date"
  // 2023-01-01T10:12:53.660Z
  // return parseTimestamp(raw)?.toISOString().replace('T', ' ') as any
  // return dayjs(parseTimestamp(raw)).format()
  return parseTimestamp(raw);
}

function parseTimestamp(raw: string | number | Date): Date;
function parseTimestamp(raw?: string | number | Date): Date | undefined;
function parseTimestamp(raw?: string | number | Date): Date | undefined {
  if (!raw) {
    return undefined;
  }
  if (raw instanceof Date) {
    return raw;
  }
  if (typeof raw === 'string') {
    raw = parseFloat(raw);
  }
  if (Number.isFinite(raw)) {
    switch (Math.floor(raw).toString().length) {
      case 10:
        return new Date(raw * 1000);
      case 13:
        return new Date(raw);
    }
  }
  throw new Error(`cannot parse timestamp: ${raw}`);
}

function toUnixTimestamp(v?: Date) {
  if (v && +v) {
    return Math.floor(+v / 1000);
  }
  return undefined;
}
