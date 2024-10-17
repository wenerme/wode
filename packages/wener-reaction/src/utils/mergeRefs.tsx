import type { LegacyRef, MutableRefObject, RefCallback } from 'react';

/**
 * mergeRefs help handling multi refs
 * @see {@link https://github.com/gregberge/react-merge-refs/blob/main/src/index.tsx gregberge/react-merge-refs}
 */
export function mergeRefs<T = any>(
  ...refs: Array<undefined | null | MutableRefObject<T | null | undefined> | RefCallback<T> | string>
): LegacyRef<T> | MutableRefObject<T> | undefined {
  const valid = refs.filter(Boolean) as Array<MutableRefObject<T | null | undefined> | ((v: T) => void)>;
  if (valid.length === 0) {
    return undefined;
  } else if (valid.length === 1) {
    return valid[0] as any;
  }
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (typeof ref === 'object' && ref && 'current' in ref) {
        ref.current = value;
      } else {
        console.error(`mergeRefs: unable to handle ref ${typeof ref}`, { ref });
      }
    });
  };
}
