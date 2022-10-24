import React from 'react';

type Runtime = Pick<typeof React, 'createElement' | 'Fragment'>;

export interface SerializeOptions extends Partial<SerializeOptionsResolved> {
  refs?: Map<any, string>;
  register?: boolean;
}

interface SerializeOptionsResolved {
  refOf: (
    type: string,
    v: any,
    o: SerializeOptionsResolved,
  ) => Record<string, any> & {
    $$ref?: string;
  };
}

/**
 * Serialize React element to JSON string
 */
export function serialize(element: React.ReactNode, { refs = new Map(), refOf, register }: SerializeOptions = {}) {
  return _ser(element, {
    refOf: (type, v, o) => {
      switch (type) {
        case 'function':
          let ref = refs.get(v);
          if (!ref && register && typeof v.name === 'string') {
            ref = v.name;
            refs.set(v, ref!);
          }
          if (ref) {
            return {
              $$ref: ref,
            };
          }
          break;
        case 'react.element':
          {
            let type = v.type;
            // omit _owner, _store, key, ref
            type = refs.get(type) || type;
            // add new components
            if (register && typeof type !== 'string' && type?.displayName) {
              refs.set(type, type.displayName);
              type = type?.displayName;
            }
            if (typeof type !== 'string') {
              throw new Error(`Deserialization error: unable to resolve component "${String(type)}"`);
            }
            return {
              type: type,
            };
          }
          break;
      }

      throw new Error(`Serialization error: unable to resolve ref of ${type} "${String(v)}"`);
    },
  });
}

function _ser(x: any, o: SerializeOptionsResolved): any {
  const { refOf } = o;
  if (typeof x === 'function') {
    return {
      ...refOf('function', x, o),
      $$typeof: 'function',
    };
  }
  if (typeof x !== 'object' || x === null) return x;
  if (Array.isArray(x)) {
    return x.map((v) => _ser(v, o));
  }

  // element
  {
    let s;
    if ((s = x['$$typeof']) && typeof s === 'symbol') {
      let to = Symbol.keyFor(s)!;
      const ele: Record<string, any> = {
        ...refOf(to, x, o),
        $$typeof: to,
        props: _ser(x.props, o),
      };
      if (typeof x.key === 'string' || typeof x.key === 'number') {
        ele.key = x.key;
      }
      return ele;
    }
  }
  return Object.keys(x).reduce((a, k) => {
    a[k] = _ser(x[k], o);
    return a;
  }, {} as Record<string, any>);
}

export interface DeserializeOptions extends Partial<DeserializeOptionsResolved> {
  refs?: Map<string, any>;
}

/**
 * Deserialize JSON string to React element
 */
export function deserialize(data: any, { refs = new Map(), ...options }: DeserializeOptions): React.ReactNode {
  return _des(data, {
    resolveOf: (type, value, options) => {
      switch (type) {
        case 'function':
          if (!refs.has(value.$$ref)) {
            throw new Error(`Deserialization error: unable to resolve function ref "${value.ref}"`);
          }
          return refs.get(value.$$ref);
        case 'react.element':
          return refs.get(value.type);
      }
      throw new Error(`Deserialization error: unable to resolve ref of ${type} "${String(value)}"`);
    },
    Runtime: React,
    ...options,
  });
}

interface ElementLike {
  $$typeof: string | symbol;
  type: React.ElementType<any> | string;
  props?: Record<string, any> & {
    children?: any;
  };
  key?: string | number;
}

interface DeserializeOptionsResolved {
  resolveOf: (type: string, value: any, options: DeserializeOptionsResolved) => any;
  Runtime: Runtime;
}

function _des(x: any, o: DeserializeOptionsResolved): any {
  if (typeof x !== 'object' || x === null) return x;
  if (Array.isArray(x)) {
    return x.map((v) => _des(v, o));
  }
  const { Runtime, resolveOf } = o;

  // element
  {
    let to;
    if ((to = x['$$typeof'])) {
      if (to === 'function') {
        return resolveOf(to, x, o);
      }

      let type = x.type;
      type = resolveOf(to, x, o) || type;
      if (typeof type === 'string' && type.toLowerCase() !== type) {
        throw new Error(`Deserialization error: unable to resolve component "${type}"`);
      }
      // @ts-ignore
      // const { children = [], ...props } = _des(x.props, o) || {};
      return Runtime.createElement(type, Object.assign({ key: x.key }, _des(x.props, o)));
    }
  }
  return Object.keys(x).reduce((a, k) => {
    a[k] = _des(x[k], o);
    return a;
  }, {} as Record<string, any>);
}
