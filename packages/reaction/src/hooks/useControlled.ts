import { Dispatch, SetStateAction, useState } from 'react';

/**
 * useControlled like useState, but accept bypass state and setState to props
 * @param value bypass state
 * @param onChange bypass steState
 * @param initial initializer for useState
 */
export function useControlled<T>(
  value: T,
  onChange: (v: T) => void,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  // do not expect change from controlled to uncontrolled
  const [state, setState] = useState<T>(initial);
  if (value === undefined) {
    if (onChange) {
      return [
        state,
        (v) => {
          setState(v);
          onChange(maybeFunction(v, state));
        },
      ];
    }
    return [state, setState];
  }
  return [
    value,
    (v) => {
      onChange(maybeFunction(v, value));
    },
  ];
}

function maybeFunction<T, A extends any[]>(v: T | ((...args: A) => T), ...args: A): T {
  return typeof v === 'function' ? (v as (...args: A) => T)(...args) : v;
}
