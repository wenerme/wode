'use client';

import { ChevronDown, X } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Dialog } from '../../base/dialog';
import { cn } from '../../utils';
import type { ConsoleModuleBrand } from './ConsoleModuleLayout';
import type { ConsoleModuleNavigationEntry } from './ConsoleNavigationModule';
import { type ConsoleNavigationLinkComponent, ConsoleNavLink } from './ConsoleShell';

/** 与 Tailwind md 断点一致；窄屏模块侧栏隐藏，由抽屉提供入口。 */
const NarrowQuery = '(max-width: 767.98px)';
export type ConsoleModuleNavigationDrawerProps = {
	brand: Omit<ConsoleModuleBrand, 'label'> & { label: string };
	items: readonly ConsoleModuleNavigationEntry[];
	linkComponent?: ConsoleNavigationLinkComponent;
	navigationLabel?: string;
	/** 宿主可覆盖模态层级。 */
	zIndex?: number;
	className?: string;
};

export function ConsoleModuleNavigationDrawer({
	brand,
	items,
	linkComponent,
	navigationLabel = '模块导航',
	zIndex = 10_000,
	className,
}: ConsoleModuleNavigationDrawerProps) {
	const narrow = useNarrowViewport();
	const [open, setOpen] = useState(false);
	if (!narrow) return null;
	const current = items.find((entry) => 'href' in entry && entry.active);
	const currentLabel = current && 'label' in current ? current.label : undefined;
	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<div
				data-slot='console-module-navigation-bar'
				className={cn(
					'border-base-300 bg-base-100 flex h-11 w-full min-w-0 shrink-0 items-center border-b px-2 md:hidden',
					className,
				)}
			>
				<Dialog.Trigger
					aria-label={`${navigationLabel}：${currentLabel ? `${brand.label} / ${currentLabel}` : brand.label}`}
					className='btn btn-ghost btn-sm min-w-0 max-w-full justify-start gap-2 px-2 font-normal'
				>
					{brand.icon ? <span className='grid size-5 shrink-0 place-items-center'>{brand.icon}</span> : null}
					<span className='shrink-0 font-semibold'>{brand.label}</span>
					{currentLabel ? (
						<>
							<span aria-hidden='true' className='text-base-content/40 shrink-0'>
								/
							</span>
							<span className='min-w-0 truncate'>{currentLabel}</span>
						</>
					) : null}
					<ChevronDown aria-hidden='true' className='size-4 shrink-0 opacity-60' />
				</Dialog.Trigger>
			</div>
			<Dialog.Portal>
				<Dialog.Backdrop className='fixed inset-0 bg-black/40' style={{ zIndex }} />
				<Dialog.Viewport className='fixed inset-0 block p-0' style={{ zIndex }}>
					<Dialog.Popup
						data-slot='console-module-navigation-drawer'
						className='bg-base-100 text-base-content border-base-300 flex h-full max-h-none w-[min(20rem,85vw)] max-w-none flex-col overflow-hidden rounded-none border-r p-0 shadow-xl outline-none'
					>
						<div className='border-base-300 flex h-14 shrink-0 items-center gap-3 border-b px-3'>
							{brand.icon ? (
								<span className='bg-neutral text-neutral-content grid size-8 shrink-0 place-items-center rounded-md'>
									{brand.icon}
								</span>
							) : null}
							<Dialog.Title className='min-w-0 flex-1 truncate text-sm'>{brand.label}</Dialog.Title>
							<Dialog.Close aria-label='关闭模块导航' className='btn btn-ghost btn-sm btn-square'>
								<X aria-hidden='true' className='size-4' />
							</Dialog.Close>
						</div>
						<nav aria-label={navigationLabel} className='flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2'>
							{items.map((entry) => {
								if ('title' in entry)
									return (
										<div
											key={entry.id ?? entry.title}
											className={cn('text-base-content/70 px-2 pt-3 pb-1 text-xs font-medium', entry.className)}
										>
											{entry.title}
										</div>
									);
								const { id, ...link } = entry;
								return (
									<ConsoleNavLink
										key={id ?? link.href}
										{...link}
										linkComponent={linkComponent}
										onClick={() => setOpen(false)}
									/>
								);
							})}
						</nav>
					</Dialog.Popup>
				</Dialog.Viewport>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

function subscribeNarrow(onChange: () => void) {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
	const query = window.matchMedia(NarrowQuery);
	query.addEventListener('change', onChange);
	return () => query.removeEventListener('change', onChange);
}
function getNarrowSnapshot() {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia(NarrowQuery).matches;
}
/** 服务端与不支持 matchMedia 的环境按桌面处理。 */
function useNarrowViewport() {
	return useSyncExternalStore(subscribeNarrow, getNarrowSnapshot, () => false);
}
