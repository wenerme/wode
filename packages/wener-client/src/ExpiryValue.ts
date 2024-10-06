import { type MaybePromise } from '@wener/utils';
import { isValueHolder, type ReadonlyValueHolder } from './ValueHolder';

export interface ExpiryValueHolder<T = string> extends ReadonlyValueHolder<T> {
  getExpiryValue(): Promise<ExpiryValue<T>>;
}

export function isExpiryValueHolder(v: any): v is ExpiryValueHolder<any> {
  return isValueHolder(v) && 'getExpiryValue' in v && typeof v.getExpiryValue === 'function';
}

export type ExpiryValueFactory<T> = (
  o: PartialRequired<Omit<CreateExpireValueHolderOptions<T>, 'value'>, 'isExpired'>,
) => Promise<{
  value: T;
  expiresAt: number | Date;
}>;

export type ExpiryValue<T = string> = {
  expiresAt: Date;
  value: T;
};
type PartialRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;

export type ExpireValueHolderInit<T = string> =
  | MaybePromise<
      | {
          value: T;
          expiresAt: number | Date;
        }
      | undefined
    >
  | ExpiryValueFactory<T>
  | ExpiryValueHolder<T>;

export interface CreateExpireValueHolderOptions<T = string> {
  value?: ExpireValueHolderInit<T>;
  loader: () => Promise<{ value: T; expiresAt: number | Date }>;
  onLoad?: (data: ExpiryValue<T>) => MaybePromise<void | ExpiryValue<T>>;
  isExpired?: (data: ExpiryValue<T>) => boolean;
}

export function createExpireValueHolder<T = string>({
  loader,
  onLoad,
  isExpired = (data) => data.expiresAt.getTime() - Date.now() < 30 * 1000, // 30s
  ...opts
}: CreateExpireValueHolderOptions<T>): ExpiryValueHolder<T> {
  if (isExpiryValueHolder(opts.value)) {
    return opts.value;
  }

  const reload = (value?: ExpiryValue<T>): MaybePromise<ExpiryValue<T>> => {
    if (!value || isExpired(value)) {
      const next: Promise<{ value: T; expiresAt: Date }> = loader().then(async ({ value, expiresAt }) => {
        expiresAt = tryParseDate(expiresAt);
        const out = { value, expiresAt };
        return (await onLoad?.(out)) ?? out;
      });
      val$ = next;
      return next;
    }

    return value;
  };

  let val$: Promise<ExpiryValue<T> | undefined>;
  if (typeof opts.value === 'function') {
    // use the callback to wrap the loader
    const realLoader = loader;
    const cb = opts.value;
    loader = async () => cb({ loader: realLoader, onLoad, isExpired });
  } else if (opts.value) {
    // delay ?
    val$ = Promise.resolve(opts.value).then((v) => coerceValue(v));
  }

  val$ ||= Promise.resolve(undefined);

  return {
    get: async () => val$.then(reload).then((v) => v.value),
    getExpiryValue: async () => val$.then(reload),
  };
}

function coerceValue<T>(o: { value: T; expiresAt: number | Date } | undefined): ExpiryValue<T> | undefined {
  if (!o) {
    return;
  }

  return {
    value: o.value,
    expiresAt: tryParseDate(o.expiresAt),
  };
}

function tryParseDate(v: number | Date): Date;
function tryParseDate(v: number | Date | undefined): Date | undefined;
function tryParseDate(v?: any): Date | undefined {
  if (!v) {
    return undefined;
  }

  if (typeof v === 'string') {
    const d = new Date(v);
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
