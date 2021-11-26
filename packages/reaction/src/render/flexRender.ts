import React, { ComponentClass, FunctionComponent, ReactElement } from 'react';

// flexible renderer
export interface FlexRenderer<P = any, A extends any[] = any[]> {
  // render as Component
  as?: string | FunctionComponent<P> | ComponentClass<P> | ReactElement<P>;
  // render by function
  render?: (...args: A) => ReactElement | null;
  // preset props
  props?: Partial<P>;
}

/**
 * @param renderer renderer to invoke
 * @param props props overrides
 * @param args function render args
 */
export function flexRender<P = any, A extends any[] = any[]>(
  renderer: FlexRenderer<P, A>,
  props: P,
  ...args: A
): null | ReactElement {
  const { as, render, props: originProps } = renderer;
  return as
    ? React.isValidElement(as)
      ? React.cloneElement(as, { ...originProps, ...props })
      : React.createElement(as, { ...originProps, ...props } as any)
    : render
    ? render(...args)
    : null;
}
