export type EventType = string | symbol;

export type Handler<E extends keyof T, T = Record<string, unknown>> = (evt: { type: E; payload: T[E] }) => void;
export type WildcardHandler<T = Record<string, unknown>> = <E extends keyof T>(evt: { type: E; payload: T[E] }) => void;

export interface Emitter<Events extends Record<EventType, unknown>> {
  on<Key extends keyof Events>(type: Key, handler: Handler<Key, Events>): void;

  on(type: '*', handler: WildcardHandler<Events>): void;

  off<Key extends keyof Events>(type: Key, handler?: Handler<Key, Events>): void;

  off(type: '*', handler: WildcardHandler<Events>): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;

  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}
