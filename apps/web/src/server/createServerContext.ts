import { cache } from 'react';
import { maybeFunction, type MaybeFunction } from '@wener/utils';

export const createServerContext = <T>(defaultValue: MaybeFunction<T>): [() => T, (v: T) => void] => {
  const getRef = cache(() => ({ current: maybeFunction(defaultValue) }));
  const getValue = (): T => getRef().current;
  const setValue = (value: T) => {
    getRef().current = value;
  };

  return [getValue, setValue];
};

const [getServerNonce, _setServerNonce] = createServerContext('000000');

export function setServerNonce(v: string = Math.random().toString(10).slice(2, 8)) {
  _setServerNonce(v);
}

export { getServerNonce };
