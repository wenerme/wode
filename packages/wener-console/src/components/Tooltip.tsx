import type { FC, ReactElement, ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui-components/react';
import { cn } from '../utils/cn';

export namespace Tooltip {
	export type CompositeProps = {
		children: ReactElement<any>;
		content?: ReactNode;
		portal?: boolean;
		placement?: 'top' | 'right' | 'bottom' | 'left';
		className?: string;
		disabled?: boolean;
		delay?: number;
	};

	type ProviderProps = BaseTooltip.Provider.Props;
	export const Provider: FC<ProviderProps> = BaseTooltip.Provider;

	export function Composite({
		children,
		content,
		portal = false,
		placement = 'top',
		className,
		disabled = false,
		delay,
	}: CompositeProps) {
		// SSR 不支持
		if (typeof window === 'undefined') return children;

		// 没有内容或禁用时直接返回子元素
		if (!content || disabled) return children;

		return (
			<BaseTooltip.Root>
				<BaseTooltip.Trigger render={children} />
				<BaseTooltip.Portal container={portal ? undefined : null}>
					<BaseTooltip.Positioner side={placement} sideOffset={4} className={'z-50'}>
						<BaseTooltip.Popup
							className={cn(
								'Tooltip bg-neutral text-neutral-content max-w-xs rounded px-2 py-1 text-sm shadow-lg',
								'animate-in fade-in-0 zoom-in-95',
								'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
								className,
							)}
						>
							{content}
							<BaseTooltip.Arrow className={'fill-neutral'} />
						</BaseTooltip.Popup>
					</BaseTooltip.Positioner>
				</BaseTooltip.Portal>
			</BaseTooltip.Root>
		);
	}
}
