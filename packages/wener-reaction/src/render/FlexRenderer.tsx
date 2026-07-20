import { type MaybeFunction, maybeFunction } from '@wener/utils';
import type { ComponentType, ReactNode } from 'react';
import { flexRender } from './flexRender';

export type FlexRendererProps<P extends {}> = P & {
	as?: ComponentType<P>;
	render?: MaybeFunction<ReactNode, [P]>;
	children?: MaybeFunction<ReactNode, [P]>;
};

export function FlexRenderer<P extends {}>({ render, as, ...props }: FlexRendererProps<P>) {
	if (as) {
		return flexRender(as as any, props as any);
	}
	if (!render && props.children) {
		render = props.children;
		props.children = undefined;
	}
	return maybeFunction(render, props as P);
}
