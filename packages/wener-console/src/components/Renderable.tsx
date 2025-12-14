import React, { type ReactElement, type ReactNode } from 'react';
import type { AnyInputComponentProps } from './props';

export type Renderable<S, P extends {} = AnyInputComponentProps> = ReactElement | ((props: P, state: S) => ReactNode);

export function resolveRenderable<S, P extends {} = AnyInputComponentProps>(
	render: Renderable<S, P> | undefined,
	props: P,
	state: S,
): ReactNode | undefined {
	if (React.isValidElement(render)) {
		return React.cloneElement(render, props);
	}
	if (typeof render === 'function') {
		return render(props, state);
	}
	return undefined;
}
