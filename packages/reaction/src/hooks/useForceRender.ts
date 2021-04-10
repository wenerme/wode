import {useReducer} from 'react';

/**
 * useForceRender return a forceRender function to fore rerender current component
 */
export function useForceRender() {
  // const [, set] = useState();
  // return () => set({});

  const [, forceRender] = useReducer((s) => s + 1, 0);
  return forceRender;
}
