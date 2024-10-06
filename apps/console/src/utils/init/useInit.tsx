import { useEffect, useState } from 'react';
import { runInit } from '@/utils/init/defineInit';

export function useInit() {
  const [state, setState] = useState({ done: false });
  useEffect(() => {
    runInit().finally(() => {
      setState({ done: true });
    });
  }, []);
  return state;
}
