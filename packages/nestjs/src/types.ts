export type AbstractConstructor<T = unknown> = abstract new (...args: any[]) => T;
export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
