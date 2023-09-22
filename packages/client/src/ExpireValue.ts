import { MaybePromise } from '@wener/utils';
import { ReadonlyValue } from './Value';

export type ExpireValue<T> = {
  expiresAt: Date;
  value: T;
};

export interface CreateExpireValueOptions<T> {
  value?: T;
  expiresAt?: number | Date;
  loader: () => Promise<{ value: T; expiresAt: number | Date }>;
  onLoad?: (data: ExpireValue<T>) => MaybePromise<void | ExpireValue<T>>;
}

export function createExpireValue<T>({ loader, onLoad, ...opts }: CreateExpireValueOptions<T>): ReadonlyValue<T> {
  let reload = ({
    value,
    expiresAt,
  }: {
    value?: T;
    expiresAt?: Date;
  }): MaybePromise<{
    value: T;
    expiresAt: Date;
  }> => {
    if (value === undefined || !expiresAt || expiresAt < new Date()) {
      let next: Promise<{ value: T; expiresAt: Date }> = loader().then(async ({ value, expiresAt }) => {
        expiresAt = tryParseDate(expiresAt);
        const out = { value, expiresAt };
        return (await onLoad?.(out)) ?? out;
      });
      val$ = next;
      return next;
    }
    return { value, expiresAt };
  };
  let val$ = Promise.resolve({
    value: opts.value,
    expiresAt: tryParseDate(opts.expiresAt),
  });
  return {
    get: () => val$.then(reload).then((v) => v.value),
  };
}

function tryParseDate(v: number | Date): Date;
function tryParseDate(v: number | Date | undefined | null): Date | undefined;
function tryParseDate(v?: any): Date | undefined {
  if (!v) {
    return undefined;
  }
  if (typeof v === 'string') {
    let d = new Date(v);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }
  if (typeof v === 'number') {
    return new Date(v);
  }
  if (v instanceof Date) {
    return v;
  }
  return undefined;
}
