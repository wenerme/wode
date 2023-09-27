declare var __DEV__: boolean;

namespace NodeJS {
  interface Process {
    // webpack check
    readonly browser?: boolean;
  }
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}
