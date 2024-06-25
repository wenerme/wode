export type EntityClass<T> = Function & {
  prototype: T;

  StateEntity?: EntityClass<any>;
  StatusEntity?: EntityClass<any>;
};
