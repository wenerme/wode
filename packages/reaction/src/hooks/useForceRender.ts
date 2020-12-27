import { useReducer } from 'react';

export function useForceRender() {
  // const [, set] = useState();
  // return () => set({});

  const [, forceRender] = useReducer((s) => s + 1, 0);
  return forceRender;
}
