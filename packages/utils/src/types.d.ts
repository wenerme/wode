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

export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
export type Constructor<T = {}> = new (...args: any[]) => T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PartialRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;

/*
https://github.com/total-typescript/ts-reset/blob/main/src/entrypoints/filter-boolean.d.ts
https://github.com/sindresorhus/type-fest
 */
