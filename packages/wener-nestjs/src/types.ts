export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;
export type Constructor<T = {}> = new (...args: any[]) => T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
