import type { FC, ReactNode } from 'react';

export const MenuLayout: FC<{
	children?: ReactNode;
	title?: ReactNode;
	menu?: Array<{ href: string; label: string }>;
}> = ({ children, title, menu = [] }) => {
	return (
		<div className={'flex h-screen'}>
			<aside className={'border-color flex w-[200px] flex-col border-r'}>
				<header className={'border-color flex items-center border-b px-2 py-4'}>
					<div className={'text-lg font-medium'}>{title}</div>
				</header>
				<ul className='menu menu-sm bg-base-100 py-2'>
					{menu.map(({ href, label }) => {
						return (
							<li key={href || label}>
								<a href={href}>{label}</a>
							</li>
						);
					})}
				</ul>
			</aside>
			<main className={'relative h-full flex-1 overflow-auto'}>
				<div className={'absolute inset-0 scrollbar-thin'}>{children}</div>
			</main>
		</div>
	);
};
