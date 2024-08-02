export type EventType = string | symbol;

type EventPayload<T = EventType, E = unknown> = { type: T; event: E };

export type Handler<T = EventType, E = unknown> = (evt: { type: T; event: E }) => void;

// An array of all currently registered event handlers for a type
export type EventHandlerList<T = unknown> = Array<Handler<EventType, T>>;

// A map of event types and their corresponding event handlers.
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
  keyof Events | '*',
  EventHandlerList<Events[keyof Events]>
>;

export interface Emitter<Events extends Record<EventType, unknown>> {
  all: EventHandlerMap<Events>;

  on<Key extends keyof Events>(type: Key, handler: Handler<Key, Events[Key]>): void;

  on(type: '*', handler: Handler<Events>): void;

  once<Key extends keyof Events>(type: Key, handler: Handler<Key, Events[Key]>): void;

  once(type: '*', handler: Handler<Events>): void;

  off<Key extends keyof Events>(type: Key, handler?: Handler<Key, Events[Key]>): void;

  off(type: '*', handler: Handler<Events>): void;

  emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;

  emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}

/**
 * Mitt: Tiny (~200b) functional event emitter / pubsub.
 * @name createEmitter
 * @returns {Emitter}
 */
export default function createEmitter<Events extends Record<EventType, unknown>>(
  all?: EventHandlerMap<Events>,
): Emitter<Events> {
  type GenericEventHandler = Handler<EventType, Events[keyof Events]>;
  all = all || new Map();
  let evt: Emitter<Events>;
  return (evt = {
    /**
     * A Map of event names to registered handler functions.
     */
    all,

    on(type: EventType, handler: GenericEventHandler) {
      const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
      if (handlers) {
        handlers.push(handler);
      } else {
        all!.set(type, [handler]);
      }
    },

    once(type: EventType, handler: GenericEventHandler) {
      let fn = handler;
      handler = (...args) => {
        evt.off(type, fn);
        fn(...args);
      };
      const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
      if (handlers) {
        handlers.push(handler);
      } else {
        all!.set(type, [handler]);
      }
    },

    off(type: EventType, handler?: GenericEventHandler) {
      const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
      if (handlers) {
        if (handler) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
          all!.set(type, []);
        }
      }
    },

    /**
     * Invoke all handlers for the given type.
     * If present, `'*'` handlers are invoked after type-matched handlers.
     *
     * Note: Manually firing '*' handlers is not supported.
     *
     * @param {string|symbol} type The event type to invoke
     * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
     * @memberOf createEmitter
     */
    emit(type: EventType, evt?: any) {
      let handlers = all!.get(type);
      let ctx: EventPayload = { type, event: evt };
      if (handlers) {
        (handlers as EventHandlerList).slice().map((handler) => {
          handler(ctx);
        });
      }

      handlers = all!.get('*');
      if (handlers) {
        (handlers as EventHandlerList).slice().map((handler) => {
          handler(ctx);
        });
      }
    },
  } as Emitter<Events>);
}
