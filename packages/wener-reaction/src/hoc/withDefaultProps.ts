import React, { type ComponentType } from 'react';
import { mergeProps as defaultMergeProps } from '../utils/mergeProps';
import { hoistNonReactStatics } from './hoistNonReactStatics';

const getComponentName = (Component: any) => Component.displayName || Component.name || 'Component';

export function withDefaultProps<P extends object, D extends Partial<P>>(
  Component: ComponentType<P>,
  defaultProps: D,
  mergeProps: (a: any, b: any) => any = defaultMergeProps,
): ComponentType<Omit<P, keyof D>> {
  const WithDefaultProps = React.forwardRef((props, ref) => {
    return React.createElement(Component, { ...mergeProps(defaultProps, props), ref });
  });
  hoistNonReactStatics(WithDefaultProps, Component);
  WithDefaultProps.displayName = `WithDefaultProps(${getComponentName(Component)})`;
  return WithDefaultProps as any;
}
