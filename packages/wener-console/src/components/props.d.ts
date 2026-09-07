import type { MaybeFunction } from '@wener/utils';
import type {
	ComponentPropsWithRef,
	CSSProperties,
	ElementType,
	HTMLAttributes,
	InputHTMLAttributes,
	ReactNode,
	Ref,
} from 'react';

export type AsProps<E extends ElementType> = ComponentPropsWithRef<E> & {
	as?: E;
};

export type WithAsProps<E extends ElementType, P extends {} = {}> = P & AsProps<E>;

export type OpenProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultOpen?: boolean;
};

export type ValueProps<T = string> = {
	value?: T;
	onValueChange?: (value: T) => void;
	defaultValue?: T;
};

export type WithActiveProps<P extends {}> = Omit<P, keyof ActiveProps> & ActiveProps;

export type ActiveProps = {
	active?: boolean;
	style?: MaybeFunction<CSSProperties, [{ active: boolean }]>;
	children?: MaybeFunction<ReactNode, [{ active: boolean }]>;
	className?: MaybeFunction<string, [{ active: boolean }]>;
	inactiveClassName?: string;
	activeClassName?: string;
	pass?: { active?: boolean; activeClassName?: boolean; inactiveClassName: boolean };
};

export type AnyComponentProps = HTMLAttributes<any> & {
	ref?: Ref<any> | undefined;
};

export type AnyInputComponentProps = InputHTMLAttributes<any> & {
	ref?: Ref<any> | undefined;
};
