import React, { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { cn } from '@wener/console';
import type { FlexRenderable } from '@wener/reaction';
import { flexRender } from '@wener/reaction';
import { clsx } from 'clsx';
import { pick } from 'es-toolkit';
import { match } from 'ts-pattern';
import { isNodeTypeOf } from '../utils/isNodeTypeOf';

export type DaisyDropdownMenuItem =
	| ({
			type?: 'item';
			label?: ReactNode;
			icon?: FlexRenderable<any>;
	  } & ComponentPropsWithoutRef<typeof Menu.Item>)
	| ({ type: 'label'; label?: ReactNode } & ComponentPropsWithoutRef<typeof Menu.GroupLabel>)
	| ({ type: 'separator' } & ComponentPropsWithoutRef<typeof Menu.Separator>);

type CompositeProps = {
	items: DaisyDropdownMenuItem[];
	children?: ReactNode;
	trigger?: ReactNode;
	portal?: boolean;

	// root
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?(open: boolean): void;
	modal?: boolean;
	//
	className?: string;
};

export const DaisyDropdownMenuComposite = ({
	items,
	children,
	trigger,
	portal,
	className,
	...props
}: CompositeProps) => {
	trigger ||= children;
	if (trigger) {
		if (!isNodeTypeOf(trigger, [Menu.Trigger, DaisyDropdownMenuTrigger])) {
			let last = trigger;
			trigger = <DaisyDropdownMenuTrigger>{last}</DaisyDropdownMenuTrigger>;
		}
	}
	let content = (
		<Menu.Positioner side={'bottom'} align={'end'} sideOffset={5}>
			<Menu.Popup className={cn('menu menu-sm rounded-box bg-base-200 z-30 w-52', className)}>
				{items.map((item, key) => {
					return match(item)
						.with({ type: 'label' }, ({ label, type, className, children, ...props }) => {
							return (
								<Menu.GroupLabel key={key} className={cn('menu-title', className)} {...props}>
									{label || children}
								</Menu.GroupLabel>
							);
						})
						.with({ type: 'separator' }, ({ type, className, ...props }) => {
							return <Menu.Separator key={key} className={cn('bg-base-300 m-[5px] h-px', className)} {...props} />;
						})
						.otherwise(({ label, icon, type, className, children, ...props }) => {
							return (
								<Menu.Item
									key={key}
									{...props}
									render={
										<li
											className={clsx(
												'outline-none select-none',
												'group/item',
												'data-[disabled]:disabled data-[disabled]:pointer-events-none',
												className,
											)}
										>
											<a className={clsx('group-data-[highlighted]/item:active')}>
												{flexRender(icon, { className: 'size-4' })}
												{label}
											</a>
										</li>
									}
								/>
							);
						});
				})}
			</Menu.Popup>
		</Menu.Positioner>
	);

	return (
		<Menu.Root {...pick(props, ['open', 'onOpenChange', 'modal', 'defaultOpen'])}>
			{trigger}
			{portal && <Menu.Portal>{content}</Menu.Portal>}
			{!portal && content}
		</Menu.Root>
	);
};

export interface DaisyDropdownMenuTriggerProps extends React.ComponentProps<typeof Menu.Trigger> {}

export const DaisyDropdownMenuTrigger: FC<DaisyDropdownMenuTriggerProps> = ({ className, ...props }) => {
	return <Menu.Trigger className={cn('btn relative', className)} {...props} />;
};

export const DaisyDropdownMenu: {
	Composite: typeof DaisyDropdownMenuComposite;
	Trigger: typeof DaisyDropdownMenuTrigger;
	Root: typeof Menu.Root;
	Portal: typeof Menu.Portal;
	Positioner: typeof Menu.Positioner;
	Popup: typeof Menu.Popup;
	Item: typeof Menu.Item;
	Separator: typeof Menu.Separator;
	GroupLabel: typeof Menu.GroupLabel;
} = {
	Composite: DaisyDropdownMenuComposite,
	Trigger: DaisyDropdownMenuTrigger,
	Root: Menu.Root,
	Portal: Menu.Portal,
	Positioner: Menu.Positioner,
	Popup: Menu.Popup,
	Item: Menu.Item,
	Separator: Menu.Separator,
	GroupLabel: Menu.GroupLabel,
};

// Export individual MenuItem type for external use
export type { DaisyDropdownMenuItem as MenuItem };
