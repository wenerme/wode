export type Equivalence<A, B = A> = (a: A, b: B) => boolean;

export type Selector<T, V = T> = (a: T) => V;
export type UseSelector<T> = <V = T>(selector: Selector<T, V>, eq?: Equivalence<any>) => V;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type PartialRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>;
