import { useEffect, useState } from 'react';
import { runInit, type InitDef } from './defineInit';

export function useInit(init?: InitDef[]) {
  const [state, setState] = useState({ done: false });
  useEffect(() => {
    runInit(init).finally(() => {
      setState({ done: true });
    });
  }, []);
  return state;
}
