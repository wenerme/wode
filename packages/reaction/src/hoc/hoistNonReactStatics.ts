// https://github.com/mridgway/hoist-non-react-statics/blob/main/src/index.js
import React from 'react';
import { ForwardRef, Memo, isMemo } from 'react-is';

const REACT_STATICS = {
  childContextTypes: true,
  contextType: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  getDerivedStateFromError: true,
  getDerivedStateFromProps: true,
  mixins: true,
  propTypes: true,
  type: true,
};

const KNOWN_STATICS: Record<string | symbol, boolean> = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  callee: true,
  arguments: true,
  arity: true,
};

const FORWARD_REF_STATICS = {
  $$typeof: true,
  render: true,
  defaultProps: true,
  displayName: true,
  propTypes: true,
};

const MEMO_STATICS = {
  $$typeof: true,
  compare: true,
  defaultProps: true,
  displayName: true,
  propTypes: true,
  type: true,
};

const TYPE_STATICS = {
  [ForwardRef]: FORWARD_REF_STATICS,
  [Memo]: MEMO_STATICS,
};

function getStatics(component: any): Record<string | symbol, boolean> {
  // React v16.11 and below
  if (isMemo(component)) {
    return MEMO_STATICS;
  }

  // React v16.12 and above
  return TYPE_STATICS[component['$$typeof']] || REACT_STATICS;
}

const defineProperty = Object.defineProperty;
const getOwnPropertyNames = Object.getOwnPropertyNames;
const getOwnPropertySymbols = Object.getOwnPropertySymbols;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const getPrototypeOf = Object.getPrototypeOf;
const objectPrototype = Object.prototype;

interface REACT_STATICS {
  childContextTypes: true;
  contextType: true;
  contextTypes: true;
  defaultProps: true;
  displayName: true;
  getDefaultProps: true;
  getDerivedStateFromError: true;
  getDerivedStateFromProps: true;
  mixins: true;
  propTypes: true;
  type: true;
}

interface KNOWN_STATICS {
  name: true;
  length: true;
  prototype: true;
  caller: true;
  callee: true;
  arguments: true;
  arity: true;
}

interface MEMO_STATICS {
  $$typeof: true;
  compare: true;
  defaultProps: true;
  displayName: true;
  propTypes: true;
  type: true;
}

interface FORWARD_REF_STATICS {
  $$typeof: true;
  render: true;
  defaultProps: true;
  displayName: true;
  propTypes: true;
}

type NonReactStatics<
  S extends React.ComponentType<any>,
  C extends {
    [key: string]: true;
  } = {},
> = {
  [key in Exclude<
    keyof S,
    S extends React.MemoExoticComponent<any>
      ? keyof MEMO_STATICS | keyof C
      : S extends React.ForwardRefExoticComponent<any>
        ? keyof FORWARD_REF_STATICS | keyof C
        : keyof REACT_STATICS | keyof KNOWN_STATICS | keyof C
  >]: S[key];
};

export function hoistNonReactStatics<
  T extends React.ComponentType<any>,
  S extends React.ComponentType<any>,
  C extends {
    [key: string | symbol]: true;
  } = {},
>(targetComponent: T, sourceComponent: S, excludelist?: C): T & NonReactStatics<S, C> {
  if (typeof sourceComponent !== 'string') {
    // don't hoist over string (html) components

    if (objectPrototype) {
      const inheritedComponent = getPrototypeOf(sourceComponent);
      if (inheritedComponent && inheritedComponent !== objectPrototype) {
        hoistNonReactStatics(targetComponent, inheritedComponent, excludelist);
      }
    }

    let keys: Array<string | symbol> = getOwnPropertyNames(sourceComponent);

    if (getOwnPropertySymbols) {
      keys = keys.concat(getOwnPropertySymbols(sourceComponent));
    }

    const targetStatics = getStatics(targetComponent);
    const sourceStatics = getStatics(sourceComponent);

    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (
        !KNOWN_STATICS[key] &&
        !(excludelist && excludelist[key]) &&
        !(sourceStatics && sourceStatics[key]) &&
        !(targetStatics && targetStatics[key])
      ) {
        const descriptor = getOwnPropertyDescriptor(sourceComponent, key);
        if (descriptor) {
          try {
            // Avoid failures from read-only properties
            defineProperty(targetComponent, key, descriptor);
          } catch (e) {}
        }
      }
    }
  }

  return targetComponent as any;
}
