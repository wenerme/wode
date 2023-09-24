import { MaybePromise } from '@wener/utils';
import { isValueHolder, ReadonlyValueHolder } from './ValueHolder';

export interface ExpiryValueHolder<T> extends ReadonlyValueHolder<T> {
  getExpiryValue(): Promise<ExpiryValue<T>>;
}

export function isExpiryValueHolder(v: any): v is ExpiryValueHolder<any> {
  return isValueHolder(v) && 'getExpiryValue' in v && typeof v.getExpiryValue === 'function';
}

export type ExpiryValue<T> = {
  expiresAt: Date;
  value: T;
};

export interface CreateExpireValueHolderOptions<T> {
  value?:
    | MaybePromise<
        | {
            value: T;
            expiresAt: number | Date;
          }
        | undefined
      >
    | ((o: Omit<CreateExpireValueHolderOptions<T>, 'value'>) => Promise<{ value: T; expiresAt: number | Date }>)
    | ExpiryValueHolder<T>;
  loader: () => Promise<{ value: T; expiresAt: number | Date }>;
  onLoad?: (data: ExpiryValue<T>) => MaybePromise<void | ExpiryValue<T>>;
  isExpired?: (data: ExpiryValue<T>) => boolean;
}

export function createExpireValueHolder<T>({
  loader,
  onLoad,
  isExpired = (data) => data.expiresAt.getTime() - Date.now() < 30 * 1000, // 30s
  ...opts
}: CreateExpireValueHolderOptions<T>): ExpiryValueHolder<T> {
  if (isExpiryValueHolder(opts.value)) {
    return opts.value;
  }

  let reload = (value?: ExpiryValue<T>): MaybePromise<ExpiryValue<T>> => {
    if (!value || isExpired(value)) {
      let next: Promise<{ value: T; expiresAt: Date }> = loader().then(async ({ value, expiresAt }) => {
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
    loader = () => {
      return cb({ loader: realLoader, onLoad, isExpired });
    };
  } else if (opts.value) {
    // delay ?
    val$ = Promise.resolve(opts.value).then((v) => coerceValue(v));
  }
  val$ ||= Promise.resolve(undefined);

  return {
    get: () => val$.then(reload).then((v) => v.value),
    getExpiryValue: () => val$.then(reload),
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
