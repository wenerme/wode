import { Dispatch, SetStateAction, useState } from 'react';
import { useEvent } from './useEvent';

/**
 * useControllable like useState, but accept bypass state and setState to props
 * @param value bypass state
 * @param onChange bypass steState
 * @param initial initializer for useState
 */
export function useControllable<T>(
  value: T | undefined,
  onChange?: (v: T) => void,
  initial?: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(initial);
  const controlled = value !== undefined;
  return [
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    controlled ? value : state!,
    useEvent((v) => {
      if (controlled) {
        return onChange?.(maybeFunction(v, value));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const next = maybeFunction(v, state!);
        setState(next);
        return onChange?.(next);
      }
    }),
  ];
}

function maybeFunction<T, A extends any[]>(v: T | ((...args: A) => T), ...args: A): T {
  return typeof v === 'function' ? (v as (...args: A) => T)(...args) : v;
}
