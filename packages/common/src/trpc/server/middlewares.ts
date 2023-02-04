import { type Sequelize } from '@sequelize/core';
import { type Transaction } from '@sequelize/core/types/transaction';
import { type MiddlewareFunction, type ProcedureParams } from '@trpc/server';

export function createSequelizeTxMiddleware<
  T extends ProcedureParams & { sequelize?: Sequelize },
>(): MiddlewareFunction<T, T & { tx?: Transaction }> {
  return ({ next, ctx }) => {
    const sequelize = (ctx as any).sequelize as Sequelize;
    if (!sequelize) {
      return next({ ctx });
    }

    return sequelize.transaction(async (tx) => {
      // fixme
      await sequelize.query(`select set_config('tenant.id', :tenantId, false)`, {
        replacements: { tenantId: '0' },
        transaction: tx,
      });
      return await next({ ctx: Object.assign({ tx }, ctx) });
    });
  };
}
