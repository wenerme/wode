import { typeOf } from 'react-is';
import { unstable_buildProxyFunction } from 'valtio';
import { deepEqual as eq } from '@wener/utils';

const canProxyOrig = unstable_buildProxyFunction()[7];
export const proxyWithCompare = unstable_buildProxyFunction(eq, undefined, (v) => {
  if (typeOf(v)) {
    return false;
  }
  if (v instanceof EventTarget) {
    // dom
    return false;
  }
  return canProxyOrig(v);
})[0];

function isNode(o: any): o is Node {
  return typeof Node === 'object'
    ? o instanceof Node
    : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
}

//Returns true if it is a DOM element
function isDomElement(o: any): o is HTMLElement {
  return typeof HTMLElement === 'object'
    ? o instanceof HTMLElement //DOM2
    : o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName === 'string';
}
