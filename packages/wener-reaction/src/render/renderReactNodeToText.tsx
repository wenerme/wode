import type { ReactElement, ReactNode } from 'react';

export function isReactElement(node: any): node is ReactElement {
  // node.$$typeof = REACT_ELEMENT_TYPE
  return typeof node === 'object' && node !== null && typeof node.type !== 'undefined';
}

export function renderReactNodeToText(node: ReactNode) {
  const walk = (_node: any): string => {
    if (!_node) return '';
    if (!isReactElement(_node)) return String(_node);

    if (Array.isArray(_node)) {
      return _node.map((v) => walk(v)).join('');
    } else if (typeof _node === 'object') {
      if (typeof _node.type === 'function') {
        return walk((_node as any).type(_node.props));
      }
      const children = Array.isArray(_node.props.children)
        ? _node.props.children.map((c: any) => walk(c)).join('')
        : walk(_node.props.children);

      switch (_node.type) {
        case 'p':
        case 'br':
        case 'div':
          return children + '\n';
        default:
          return children;
      }
    }
    return String(_node);
  };

  return walk(node);
}
