import React, { cloneElement, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { mergeProps as defaultMergeProps } from '../utils/mergeProps';
import { isReactComponent } from './isReactComponent';

/**
 * FlexRenderable maybe a component maybe an element
 *
 * The Component doesn't have to match the props type
 */
export type FlexRenderable<TProps> = ReactNode | ComponentType<Partial<TProps>>;

/**
 * flexRender will try to render a component or a React node
 *
 * When passing a {@link mergeProps}, will clone the element and merge the props.
 *
 * @param Comp component or react node
 * @param props props to pass to component
 * @param mergeProps merge props to pass to component
 * @see {@link https://github.com/TanStack/table/blob/3f0e5d285af94b604734d71f710643c53a43ef0d/packages/react-table/src/index.tsx TanStack/table}
 */
export function flexRender<TProps extends object>(
  Comp: FlexRenderable<TProps>,
  props: TProps,
  mergeProps?: ((a: TProps, b: TProps) => TProps) | true,
): ReactNode | ReactElement {
  if (!Comp) {
    return null;
  }
  if (isReactComponent<TProps>(Comp)) {
    return <Comp {...props} />;
  }
  // for mergeProps
  if (mergeProps) {
    const merge = mergeProps === true ? flexRender.mergeProps : mergeProps;
    if (typeof Comp === 'object' && 'props' in Comp) {
      return cloneElement(Comp, merge(Comp.props, props));
    }
  }
  // various ReactNode types
  return Comp as any;
}

flexRender.mergeProps = defaultMergeProps;
