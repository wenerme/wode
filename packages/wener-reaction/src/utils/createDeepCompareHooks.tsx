import React from 'react';
import type { Equivalence } from '../typing';

/**
 * create deep compare hooks based on eq
 * @param eq equality check function - e.g. react-fast-compare, dequal
 * @see {@link https://github.com/sandiiarov/use-deep-compare sandiiarov/use-deep-compare}
 */
export function createDeepCompareHooks(eq: Equivalence<any | undefined>) {
  function useDeepCompareMemoize(value: React.DependencyList) {
    const ref = React.useRef<React.DependencyList>([]);
    if (!eq(value, ref.current)) {
      ref.current = value;
    }
    return ref.current;
  }

  function useDeepCompareCallback<T extends (...args: any[]) => any>(callback: T, dependencies: React.DependencyList) {
    if (process.env.NODE_ENV !== 'production') {
      checkDeps(dependencies, 'useDeepCompareCallback');
    }

    return React.useCallback(callback, useDeepCompareMemoize(dependencies));
  }

  function useDeepCompareEffect(effect: React.EffectCallback, dependencies: React.DependencyList) {
    if (process.env.NODE_ENV !== 'production') {
      checkDeps(dependencies, 'useDeepCompareEffect');
    }

    React.useEffect(effect, useDeepCompareMemoize(dependencies));
  }

  function useDeepCompareMemo<T>(factory: () => T, dependencies: React.DependencyList) {
    if (process.env.NODE_ENV !== 'production') {
      checkDeps(dependencies, 'useDeepCompareMemo');
    }

    return React.useMemo(factory, useDeepCompareMemoize(dependencies));
  }

  return {
    useDeepCompareMemoize,
    useDeepCompareCallback,
    useDeepCompareEffect,
    useDeepCompareMemo,
  };
}

function checkDeps(deps: React.DependencyList, name: string) {
  const reactHookName = `React.${name.replace(/DeepCompare/, '')}`;

  if (!deps || deps.length === 0) {
    throw new Error(`${name} should not be used with no dependencies. Use ${reactHookName} instead.`);
  }
}
