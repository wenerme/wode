export type Equivalence<A, B = A> = (a: A, b: B) => boolean;
export type Selector<T, V = T> = (a: T) => V;
