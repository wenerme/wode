export type EntityClass<T> = Function & {
  prototype: T;
};

export type ObjectClass<T> = Function & {
  prototype: T;
};

export interface PageResponse<T> {
  total: number;
  data: T[];
}
