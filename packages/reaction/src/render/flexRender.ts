import React, {FunctionComponent, ReactElement} from 'react';

// 灵活渲染组件 - 支持 builder 组件场景
export interface FlexRenderer<P = any, A extends any[] = any[]> {
  // 使用组件渲染
  as?: string | FunctionComponent<P>;
  // 使用函数渲染
  render?: (...args: A) => ReactElement;
  // 预设属性
  props?: P;
}

export function flexRender<P = any, A extends any[] = any[]>(
  {as, render, props: presetProps}: FlexRenderer<P, A>,
  props: P,
  ...args: A
): null | ReactElement {
  return as
    ? React.isValidElement(as)
      ? React.cloneElement(as, {...presetProps, ...props})
      : React.createElement(as, {...presetProps, ...props} as any)
    : render
      ? render(...args)
      : null;
}
