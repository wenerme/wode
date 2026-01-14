import type { ReactElement, ReactNode } from 'react';

export function resolveWithDefault<T>(value: boolean | T | undefined, defaultValue: T): T | undefined {
	if (value === false) {
		return undefined;
	}
	if (value === true || value === undefined) {
		return defaultValue;
	}
	return value;
}

export function resolveElement<T>(
	value: boolean | T | undefined | ReactElement,
	render: (props: T | undefined) => ReactNode,
): ReactNode {
	if (value === false) {
		return undefined;
	}
	if (value === true || value === undefined) {
		return render(undefined);
	}
	return render(value as T);
}
