import type React from 'react';

/**
 * mergeRefs help handling multi refs
 * @see {@link https://github.com/gregberge/react-merge-refs/blob/main/src/index.tsx gregberge/react-merge-refs}
 */
export function mergeRefs<T = any>(
  ...refs: Array<undefined | null | React.MutableRefObject<T | null | undefined> | React.RefCallback<T> | string>
): React.LegacyRef<T> | React.MutableRefObject<T> | undefined {
  const valid = refs.filter(Boolean) as Array<React.MutableRefObject<T | null | undefined> | ((v: T) => void)>;
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
