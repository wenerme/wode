import type { DependencyList, EffectCallback } from 'react';
import React, { useEffect } from 'react';
import { shallowEqual } from '@wener/utils';

/**
 * useCompareEffect will call callback if deps is changed
 * @param f callback function if different
 * @param deps compare target
 * @param eq comparator default to {@link @wener/utils!shallowEqual} - e.g. react-fast-compare
 */
export function useCompareEffect<D = DependencyList>(
  f: EffectCallback,
  deps: D,
  eq: (a: D, b: D) => boolean = useCompareEffect.defaultComparator,
) {
  const counter = React.useRef(0);
  const prev = React.useRef(deps);
  if (!eq(deps, prev.current)) {
    counter.current++;
    prev.current = deps;
  }
  useEffect(f, [counter.current]);
}

/**
 * default comparator for {@link useCompareEffect} is {@link shallowEqual}
 */
useCompareEffect.defaultComparator = shallowEqual;
