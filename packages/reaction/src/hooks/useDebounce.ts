import { useEffect, useState } from 'react';

/**
 * useDebounce will return the same value in delay, prevent the value change too fast
 * @param value
 * @param delay
 */
export function useDebounce<T>(value: T, delay = 0): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
