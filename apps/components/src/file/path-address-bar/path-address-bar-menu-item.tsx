import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/utils';

export type PathAddressBarMenuItemProps = ComponentPropsWithRef<typeof BaseMenu.Item>;

export function PathAddressBarMenuItem({ className, ...props }: PathAddressBarMenuItemProps) {
	return (
		<BaseMenu.Item
			className={cn(
				'flex min-h-8 min-w-0 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none',
				'data-[highlighted]:bg-base-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
				className,
			)}
			{...props}
		/>
	);
}
