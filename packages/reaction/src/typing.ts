export type Equivalence<A, B = A> = (a: A, b: B) => boolean;
export type Selector<T, V = T> = (a: T) => V;
export type UseSelector<T> = <V = T>(selector: Selector<T, V>, eq?: Equivalence<any>) => V;