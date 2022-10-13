import type React from 'react';

/**
 * mergeRefs help handling multi refs
 * @see {@link https://github.com/gregberge/react-merge-refs/blob/main/src/index.tsx gregberge/react-merge-refs}
 */
export function mergeRefs<T = any>(
  ...refs: Array<undefined | null | React.MutableRefObject<T | null | undefined> | React.RefCallback<T> | string>
): React.LegacyRef<T> | React.MutableRefObject<T> | undefined {
  const valid = refs.filter(Boolean);
  if (valid.length === 0) {
    return undefined;
  } else if (valid.length === 1) {
    return valid[0] as any;
  }
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }
      if (typeof ref === 'string') {
        console.error('Cannot pass string refs to mergeRefs');
        return;
      }
      if (typeof ref === 'function') {
        ref(value);
      } else {
        ref.current = value;
      }
    });
  };
}
