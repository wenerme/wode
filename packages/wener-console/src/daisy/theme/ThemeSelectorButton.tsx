import classNames from 'clsx';
import { useState } from 'react';
import { HiChevronDown, HiColorSwatch } from 'react-icons/hi';
import { MdSettings } from 'react-icons/md';
import { DaisyTheme } from './DaisyTheme';
import { getSupportedThemes } from './getSupportedThemes';
import { ThemePreviewCard } from './ThemePreviewCard';

export const ThemeSelectorButton = () => {
	const [state, update] = DaisyTheme.useThemeState();
	const { theme } = state;
	const [isOpen, setIsOpen] = useState(false);
	const setTheme = (v: string) => {
		update({ theme: v });
		setIsOpen(false);
	};

	return (
		<div className='dropdown dropdown-end'>
			<div
				tabIndex={0}
				role='button'
				className={classNames(
					'bg-opacity-20 hover:bg-opacity-30 focus-visible:ring-opacity-75 inline-flex items-center justify-center gap-0.5 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white',
					'hover:bg-base-200 cursor-pointer transition-colors',
				)}
				onClick={() => setIsOpen(!isOpen)}
			>
				<HiColorSwatch className={'h-6 w-6'} />
				<span className={'hidden sm:inline'}>主题</span>
				<HiChevronDown />
			</div>
			{isOpen && (
				<ul
					className={classNames(
						'dropdown-content menu bg-base-200 absolute right-0 z-50 flex h-[400px] w-[200px] flex-col gap-2 overflow-y-auto rounded p-2 text-sm',
						'border-base-300 border shadow-lg',
					)}
				>
					{[{ label: '跟随系统', value: 'system' }, ...getSupportedThemes()].map((item) => (
						<li key={item.value}>
							<button
								onClick={() => setTheme(item.value)}
								data-theme={item.value}
								className={classNames(
									'cursor-pointer',
									'rounded p-2',
									'flex items-center justify-between',
									'bg-base-100 text-base-content',
									'border border-transparent',
									'hover:border-primary-focus',
									theme === item.value && 'border-primary-focus',
								)}
							>
								{item.value === 'system' ? (
									<>
										<MdSettings />
										{item.label}
									</>
								) : (
									<ThemePreviewCard title={item.value} />
								)}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
