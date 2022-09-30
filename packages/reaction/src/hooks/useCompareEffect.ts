import React, { DependencyList, EffectCallback, useEffect } from 'react';
import { shallowEqual } from '@wener/utils';

/**
 * useCompareEffect will call callback if deps is changed
 * @param f callback function if different
 * @param deps compare target
 * @param eq comparator default to {@link shallowEqual} - e.g. react-fast-compare
 */
export function useCompareEffect(
  f: EffectCallback,
  deps: DependencyList,
  eq: (a: DependencyList, b: DependencyList) => boolean = useCompareEffect.defaultComparator,
) {
  const counter = React.useRef(0);
  const prev = React.useRef(deps);
  if (!eq(deps, prev.current)) {
    counter.current++;
    prev.current = deps;
  }
  useEffect(f, [counter.current]);
}

useCompareEffect.defaultComparator = shallowEqual;
