/** 枚举对象的实际值，排除用于创建无原型对象的 __proto__ 属性。 */
export type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];
