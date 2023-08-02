import React, { ReactElement, ReactNode } from 'react';
import { mergeProps as defaultMergeProps } from '../utils/mergeProps';
import { isReactComponent } from './isReactComponent';

/**
 * FlexRenderable maybe a component maybe an element
 *
 * The Component doesn't have to match the props type
 */
export type FlexRenderable<TProps> = React.ReactNode | React.ComponentType<Partial<TProps>>;

/**
 * flexRender will try to render a component or a React node
 *
 * When passing a {@link mergeProps}, will clone the element and merge the props.
 *
 * @param Comp component or react node
 * @param props props to pass to component
 * @param mergeProps merge props to pass to component
 * @see {@link https://github.com/TanStack/table/blob/af00c821b7943bc0f6d62a19b3ad514e3f315d75/packages/react-table/src/index.tsx TanStack/table}
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
  {
    if (mergeProps === true) {
      mergeProps = flexRender.mergeProps;
    }
    if (typeof mergeProps === 'function' && typeof Comp === 'object' && 'props' in Comp) {
      return React.cloneElement(Comp, (mergeProps as any)(Comp.props, props));
    }
  }
  // various ReactNode types
  return Comp as any;
}

flexRender.mergeProps = defaultMergeProps;
