import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { flexRender, type FlexRenderable } from '@wener/reaction';
import { parseBoolean } from '@wener/utils';
import { cn } from '../../utils/cn';
import type { AnyComponentProps } from '../props';
import { ActionIcon } from './ActionIcon';

export interface IconState {
	active: boolean;
	solid: boolean;
	disabled: boolean;
}

export type IconProps = Omit<AnyComponentProps, 'className'> & {
	/** Icon to render */
	icon?: FlexRenderable<any>;
	/** Icon to render when active */
	activeIcon?: FlexRenderable<any>;
	/** Icon to render when disabled */
	disabledIcon?: FlexRenderable<any>;
	/** Use predefined action icon */
	action?: keyof typeof ActionIcon;
	/** Active state */
	active?: boolean;
	/** Solid/filled variant */
	solid?: boolean;
	/** Disabled state */
	disabled?: boolean;
	/** className - can be string or function based on state */
	className?: string | ((state: IconState) => string);
	/** Props to pass to the rendered icon */
	passthrough?: {
		active?: boolean;
		solid?: boolean;
		disabled?: boolean;
		className?: boolean;
	};

	render?: (props: ComponentPropsWithoutRef<any>, state: IconState) => ReactNode;
};

export const Icon: FC<IconProps> = ({
	icon,
	activeIcon,
	disabledIcon,
	action,
	active,
	solid = false,
	disabled = false,
	className,
	passthrough,
	render,
	...props
}) => {
	active ??= parseBoolean((props as any)['data-active']) ?? false;
	disabled ??= parseBoolean((props as any)['data-disabled']) ?? false;
	solid ??= parseBoolean((props as any)['data-solid']) ?? false;

	// Resolve icon from action if not provided
	if (!icon && action) {
		icon = ActionIcon[action];
	}

	let iconToRender = icon;
	if (disabled && disabledIcon) {
		iconToRender = disabledIcon;
	} else if (active && activeIcon) {
		iconToRender = activeIcon;
	}

	// Create state object
	const state: IconState = { active, solid, disabled };

	let finalClassName: string;
	if (typeof className === 'function') {
		finalClassName = className(state);
	} else {
		if (passthrough?.className === false) {
			finalClassName = className || '';
		} else {
			finalClassName = cn(className, active && 'active', disabled && 'disabled', solid && 'solid');
		}
	}

	let passProps: Record<string, any> = {};
	if (passthrough) {
		const stateProps = {
			active,
			solid,
			disabled,
		};

		for (const key of ['active', 'solid', 'disabled'] as const) {
			if (passthrough[key]) {
				passProps[key] = stateProps[key];
			}
		}
	}

	if (render) {
		return render(
			{
				...props,
				...passProps,
				className: finalClassName,
			},
			state,
		);
	}

	if (!iconToRender) {
		return null;
	}

	return flexRender(
		iconToRender,
		{
			...props,
			...passProps,
			className: finalClassName,
		},
		true,
	);
};
