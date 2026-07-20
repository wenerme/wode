'use client';

import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { SettingLayout } from '../../components/SettingLayout/SettingLayout';
import { DaisyTheme, DaisyThemeDemo, ThemeListSelector } from '../../daisy';
import { getPrefersColorSchema } from '../../utils/getPrefersColorSchema';

export namespace AppearanceSettingPage {
	export interface CompositeProps extends ComponentPropsWithoutRef<'div'> {
		children?: ReactNode;
	}

	export const Layout: FC<
		Omit<ComponentPropsWithoutRef<'div'>, 'title'> & { title?: ReactNode; action?: ReactNode }
	> = ({ title, action, children, ...props }) => {
		return (
			<SettingLayout title={title} action={action} {...props}>
				{children}
			</SettingLayout>
		);
	};

	export const Header: FC<{
		title?: ReactNode;
		useSystemTheme?: boolean;
		onToggleSystemTheme?: (enabled: boolean) => void;
	}> = ({ title = '主题设置', useSystemTheme, onToggleSystemTheme }) => {
		const [{ theme }, update] = DaisyTheme.useThemeState();
		const isSystemTheme = theme === 'system';
		const handleToggle = () => {
			const newValue = isSystemTheme ? getPrefersColorSchema() : 'system';
			update({ theme: newValue });
			onToggleSystemTheme?.(newValue === 'system');
		};

		return (
			<div className={'flex items-center gap-2'}>
				<span>{title}</span>
				<fieldset>
					<label className='label cursor-pointer'>
						<span className='label-text'>使用系统配色</span>
						<input
							type='checkbox'
							className='toggle toggle-accent toggle-sm'
							checked={useSystemTheme ?? isSystemTheme}
							onChange={handleToggle}
						/>
					</label>
				</fieldset>
			</div>
		);
	};

	export const ThemeSelector: FC = () => {
		return <ThemeListSelector />;
	};

	export const Preview: FC = () => {
		return <DaisyThemeDemo />;
	};

	export const Content = () => {
		return (
			<>
				<ThemeSelector />
				<div className='divider'>主题组件示例</div>
				<Preview />
			</>
		);
	};

	export const Composite: FC<CompositeProps> = ({ children, ...props }) => {
		return (
			<Layout title={<Header />} {...props}>
				<Content />
				{children}
			</Layout>
		);
	};
}
