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
			const elem = _node as ReactElement;
			if (typeof elem.type === 'function') {
				return walk((elem.type as (props: unknown) => ReactNode)(elem.props));
			}
			const props = elem.props as Record<string, unknown>;
			const children = Array.isArray(props.children)
				? (props.children as unknown[]).map((c) => walk(c)).join('')
				: walk(props.children);

			switch (_node.type) {
				case 'p':
				case 'br':
				case 'div':
					return `${children}\n`;
				default:
					return children;
			}
		}
		return String(_node);
	};

	return walk(node);
}
