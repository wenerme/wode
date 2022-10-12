import type { CSSProperties, Ref } from 'react';
import { mergeRefs } from './mergeRefs';

/**
 * mergeProps will merge className, style and ref
 * @param source source
 * @param override override
 */
export function mergeProps<T extends { className?: string; style?: CSSProperties; ref?: Ref<any> }>(
  source: T,
  override: T,
): T {
  const o = {
    ...source,
    ...override,
    className: [source.className, override.className].filter(Boolean).join(' '),
    style: { ...source.style, ...override.style },
    ref: mergeRefs(source.ref, override.ref),
  };
  return o;
}
