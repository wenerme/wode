import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from 'next-auth/adapters';
import type { Model, ModelOptions, ModelStatic, Sequelize } from '@sequelize/core';
import type { InitOptions } from '@sequelize/core/types/model';
import * as defaultModels from './AuthModels';
import { Account, initAuthModels, Session, User, VerificationToken } from './AuthModels';

export { defaultModels as models };

// @see https://sequelize.org/master/manual/typescript.html
interface AccountInstance extends Model<AdapterAccount, Partial<AdapterAccount>>, AdapterAccount {}

interface UserInstance extends Model<AdapterUser, Partial<AdapterUser>>, AdapterUser {}

interface SessionInstance extends Model<AdapterSession, Partial<AdapterSession>>, AdapterSession {}

// interface VerificationTokenInstance extends Model<VerificationToken, Partial<VerificationToken>>, VerificationToken {
// }

export interface SequelizeAdapterOptions {
  synchronize?: boolean;
  models?: Partial<{
    User: ModelStatic<UserInstance>;
    Account: ModelStatic<AccountInstance>;
    Session: ModelStatic<SessionInstance>;
    VerificationToken: ModelStatic<VerificationToken>;
  }>;
  defineModelOptions?: ModelOptions<any>;
}

export function SequelizeAdapter(client: Sequelize, options?: SequelizeAdapterOptions): Adapter {
  const { models, synchronize = false, defineModelOptions } = options ?? {};
  const defaultModelOptions: InitOptions<any> = {
    sequelize: client,
    underscored: true,
    timestamps: true,
    ...defineModelOptions,
  };
  // const { Account } = {
  //   Account: models?.Account ?? client.define<AccountInstance>('account', defaultModels.Account, defaultModelOptions),
  // };

  initAuthModels(defaultModelOptions);
  let _synced = false;
  const sync = async () => {
    if (process.env.NODE_ENV !== 'production' && synchronize && !_synced) {
      const syncOptions = typeof synchronize === 'object' ? synchronize : undefined;

      await Promise.all([
        User.sync(syncOptions),
        Account.sync(syncOptions),
        Session.sync(syncOptions),
        VerificationToken.sync(syncOptions),
      ]);

      _synced = true;
    }
  };

  return {
    async createUser(user) {
      await sync();
      console.debug('createUser', user);
      return (await User.create({ ...user, raw: JSON.parse(JSON.stringify(user)) } as any)) as AdapterUser;
    },
    async getUser(id) {
      await sync();

      const userInstance = await User.findByPk(id);

      return userInstance?.get({ plain: true }) ?? null;
    },
    async getUserByEmail(email) {
      await sync();

      const userInstance = await User.findOne({
        where: { email },
      });

      return userInstance?.get({ plain: true }) ?? null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      await sync();

      const accountInstance = await Account.findOne({
        where: { provider, providerAccountId },
      });

      if (!accountInstance) {
        return null;
      }

      const userInstance = await User.findByPk(accountInstance.userId);

      return userInstance?.get({ plain: true }) ?? null;
    },
    async updateUser(user) {
      await sync();

      await User.update(user, { where: { id: user.id }, returning: true });
      const userInstance = await User.findByPk(user.id);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return userInstance!;
    },
    async deleteUser(userId) {
      await sync();

      const userInstance = await User.findByPk(userId);

      await User.destroy({ where: { id: userId } });

      return userInstance;
    },
    async linkAccount(account) {
      await sync();
      await Account.create({
        ...account,
        expires_at: toSQLTimestamp(account.expires_at),
        raw: JSON.parse(JSON.stringify(account)),
      } as any);
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await sync();

      await Account.destroy({
        where: { provider, providerAccountId },
      });
    },
    async createSession(session) {
      await sync();

      const data = {
        ...session,
        expires: toSQLTimestamp(session.expires)?.toJSON(),
        expires_at: toSQLTimestamp(session.expires)?.toJSON(),
      };
      return await Session.create(data);
    },
    async getSessionAndUser(sessionToken) {
      await sync();

      const sessionInstance = await Session.findOne({
        where: { sessionToken },
      });

      if (!sessionInstance) {
        return null;
      }

      const userInstance = await User.findByPk(sessionInstance.userId);

      if (!userInstance) {
        return null;
      }

      return {
        session: sessionInstance?.get({ plain: true }),
        user: userInstance?.get({ plain: true }),
      };
    },
    async updateSession({ sessionToken, expires }) {
      await sync();

      await Session.update({ expires: toSQLTimestamp(expires), sessionToken }, { where: { sessionToken } });
      return await Session.findOne({ where: { sessionToken } });
    },
    async deleteSession(sessionToken) {
      await sync();

      await Session.destroy({ where: { sessionToken } });
    },
    async createVerificationToken(token) {
      await sync();

      return await VerificationToken.create({ ...token, expires: parseTimestamp(token.expires) });
    },
    async useVerificationToken({ identifier, token }) {
      await sync();

      const tokenInstance = await VerificationToken.findOne({
        where: { identifier, token },
      });

      await VerificationToken.destroy({ where: { identifier } });

      return tokenInstance?.get({ plain: true }) ?? null;
    },
  };
}

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
