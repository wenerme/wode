import { createElement, forwardRef, type ComponentType } from 'react';
import { mergeProps as defaultMergeProps } from '../utils/mergeProps';
import { hoistNonReactStatics } from './hoistNonReactStatics';

const getComponentName = (Component: any) => Component.displayName || Component.name || 'Component';

export function withDefaultProps<P extends object, D extends Partial<P>>(
  Component: ComponentType<P>,
  defaultProps: D,
  mergeProps: (a: any, b: any) => any = defaultMergeProps,
): ComponentType<Omit<P, keyof D>> {
  const WithDefaultProps = forwardRef((props, ref) => {
    return createElement(Component, { ...mergeProps(defaultProps, props), ref });
  });
  hoistNonReactStatics(WithDefaultProps, Component);
  WithDefaultProps.displayName = `WithDefaultProps(${getComponentName(Component)})`;
  return WithDefaultProps as any;
}
