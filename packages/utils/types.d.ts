/* eslint-disable */

declare var __DEV__: boolean;

namespace NodeJS {
  interface Process {
    readonly browser?: boolean;
  }
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}
