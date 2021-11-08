import React, { ComponentClass, FunctionComponent, ReactElement } from 'react';

// flexible renderer
export interface FlexRenderer<P = any, A extends any[] = any[]> {
  // render as Component
  as?: string | FunctionComponent<P> | ComponentClass<P> | ReactElement<P>;
  // render by function
  render?: (...args: A) => ReactElement;
  // preset props
  props?: P;
}

/**
 * @param props props overrides
 * @param args function render args
 */
export function flexRender<P = any, A extends any[] = any[]>(
  { as, render, props: presetProps }: FlexRenderer<P, A>,
  props: P,
  ...args: A
): null | ReactElement {
  return as
    ? React.isValidElement(as)
      ? React.cloneElement(as, { ...presetProps, ...props })
      : React.createElement(as, { ...presetProps, ...props } as any)
    : render
    ? render(...args)
    : null;
}
