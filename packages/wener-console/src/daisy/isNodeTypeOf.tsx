import React, { type JSXElementConstructor, type ReactElement, type ReactNode } from 'react';
import { arrayOfMaybeArray, type MaybeArray } from '@wener/utils';

export function isNodeTypeOf(
  ele: ReactNode,
  component: MaybeArray<string | JSXElementConstructor<any>>,
): ele is ReactElement {
  return React.isValidElement(ele) && arrayOfMaybeArray(component).includes(ele.type as any);
}
