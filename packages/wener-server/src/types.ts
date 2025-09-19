export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type { Constructor, AbstractConstructor } from '@wener/utils';
