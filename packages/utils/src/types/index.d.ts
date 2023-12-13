export type AbstractConstructor<T = unknown> = abstract new (...args: any[]) => T;
export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PartialRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;

/*
https://github.com/total-typescript/ts-reset/blob/main/src/entrypoints/filter-boolean.d.ts
https://github.com/sindresorhus/type-fest
 */
