import type { ComponentType } from 'react';
import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { mergeProps as defaultMergeProps } from '../utils/mergeProps';

const getComponentName = (Component: any) => Component.displayName || Component.name || 'Component';

export function withDefaultProps<P extends object, D extends object>(
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
