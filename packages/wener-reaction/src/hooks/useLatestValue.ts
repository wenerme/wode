import { useRef } from 'react';
import { useIsoMorphicEffect } from './useIsoMorphicEffect';

export function useLatestValue<T>(value: T) {
  const cache = useRef(value);

  useIsoMorphicEffect(() => {
    cache.current = value;
  }, [value]);

  return cache;
}
