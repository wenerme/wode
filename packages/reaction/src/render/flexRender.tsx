import React from 'react';
import { mergeProps as defaultMergeProps } from '../utils/mergeProps';

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
): React.ReactNode | JSX.Element {
  if (!Comp) {
    return undefined;
  }
  if (isReactComponent<TProps>(Comp)) {
    return <Comp {...props} />;
  }
  if (mergeProps === true) {
    mergeProps = flexRender.mergeProps;
  }
  if (typeof mergeProps === 'function' && typeof Comp === 'object' && 'props' in Comp) {
    return React.cloneElement(Comp, (mergeProps as any)(Comp.props, props));
  }
  // various ReactNode types
  return Comp as any;
}

flexRender.mergeProps = defaultMergeProps;

function isReactComponent<TProps>(component: unknown): component is React.ComponentType<TProps> {
  return isClassComponent(component) || typeof component === 'function' || isExoticComponent(component);
}

function isClassComponent(component: any) {
  return (
    typeof component === 'function' &&
    (() => {
      const proto = Object.getPrototypeOf(component);
      return proto.prototype?.isReactComponent;
    })()
  );
}

function isExoticComponent(component: any) {
  return (
    typeof component === 'object' &&
    typeof component.$$typeof === 'symbol' &&
    ['react.memo', 'react.forward_ref'].includes(component.$$typeof.description)
  );
}
