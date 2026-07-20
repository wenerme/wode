export type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];

export type StateUpdater<T> = Partial<T> | ((prevState: T) => undefined | T);
export type SetState<T> = (action: StateUpdater<T>) => void;
