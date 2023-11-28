import { useMemo } from 'react';
import { createStore } from 'zustand';

export function useLogger(name: string): Logger {
  return useMemo(() => getLogger(name), [name]);
}

export interface Logger {
  (...data: any[]): void;

  debug(...data: any[]): void;

  info(...data: any[]): void;

  error(...data: any[]): void;

  warn(...data: any[]): void;
}

const Store = createStore<{
  loggers: Record<string, Logger>;
}>(() => {
  return {
    loggers: {},
  };
});

export function getLogger(name: string): Logger {
  const state = Store.getState();
  let {
    loggers: { [name]: log },
  } = state;
  if (!log) {
    log = createLogger(name);
    Store.setState({ loggers: { ...state.loggers, [name]: log } });
  }
  return log;
}

function createLogger(name: string) {
  const log = (...args: any[]) => {
    if (!name) {
      return console.log(...args);
    }
    return console.log(`[${name}]`, ...args);
  };
  return Object.assign(log, { log, debug: log, info: log, error: log, warn: log });
}
