'use client';

import { useEffect, useState } from 'react';
import {
	ConsoleModuleLayout,
	type ConsoleModuleLayoutProps,
	ConsoleModuleLink,
	type ConsoleModuleLinkProps,
	ConsoleModuleTitle,
} from './ConsoleModuleLayout';
import type { ConsoleNavigationLinkComponent } from './ConsoleShell';

export type ConsoleModuleNavigationEntry =
	| { id?: string; title: string; className?: string }
	| (Pick<ConsoleModuleLinkProps, 'href' | 'label' | 'icon' | 'active' | 'badge' | 'className'> & { id?: string });
export type ConsoleNavigationModuleProps = Omit<ConsoleModuleLayoutProps, 'children'> & {
	items: readonly ConsoleModuleNavigationEntry[];
	storageKey?: string;
	linkComponent?: ConsoleNavigationLinkComponent;
};

/** storageKey 切换会重建局部状态，避免上一模块的折叠偏好写入新模块。 */
export function ConsoleNavigationModule(props: ConsoleNavigationModuleProps) {
	return <NavigationModule key={JSON.stringify(props.storageKey ?? null)} {...props} />;
}

function NavigationModule({
	items,
	storageKey,
	defaultCollapsed = false,
	collapsed: controlledCollapsed,
	onCollapsedChange,
	linkComponent,
	...props
}: ConsoleNavigationModuleProps) {
	// 首次客户端渲染和服务端保持一致，挂载后再读取浏览器偏好。
	const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed);
	useEffect(() => {
		if (!storageKey) return;
		try {
			const stored = window.localStorage.getItem(storageKey);
			if (stored === 'true' || stored === 'false') setLocalCollapsed(stored === 'true');
		} catch {
			// 浏览器禁止存储时仍保留本次会话的折叠操作。
		}
	}, [storageKey]);
	const collapsed = controlledCollapsed ?? localCollapsed;
	useEffect(() => {
		if (controlledCollapsed !== undefined) persistCollapsed(storageKey, controlledCollapsed);
	}, [controlledCollapsed, storageKey]);
	return (
		<ConsoleModuleLayout
			{...props}
			collapsed={collapsed}
			onCollapsedChange={(next) => {
				if (controlledCollapsed === undefined) {
					setLocalCollapsed(next);
					persistCollapsed(storageKey, next);
				}
				onCollapsedChange?.(next);
			}}
		>
			{items.map((entry) => {
				if ('title' in entry)
					return (
						<ConsoleModuleTitle key={entry.id ?? entry.title} className={entry.className}>
							{entry.title}
						</ConsoleModuleTitle>
					);
				const { id, ...link } = entry;
				return <ConsoleModuleLink key={id ?? link.href} {...link} linkComponent={linkComponent} />;
			})}
		</ConsoleModuleLayout>
	);
}

function persistCollapsed(storageKey: string | undefined, collapsed: boolean) {
	if (!storageKey) return;
	try {
		window.localStorage.setItem(storageKey, String(collapsed));
	} catch {
		// 隐私模式与配额限制不应阻断导航。
	}
}
