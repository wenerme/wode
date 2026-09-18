export type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];
