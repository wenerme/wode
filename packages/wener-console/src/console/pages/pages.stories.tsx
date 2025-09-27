import React from 'react';
import type { Meta } from '@storybook/react';
import { Image } from '@wener/console/components';
import { AppearanceSettingPage } from './AppearanceSettingPage/AppearanceSettingPage';
import { LoginPage } from './LoginPage';
import { SystemAboutPage } from './SystemAboutPage';

const meta: Meta = {
	title: 'console/pages',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;

export const SystemAboutPageDemo = () => {
	return <SystemAboutPage />;
};

export const AppearanceSettingPageDemo = () => {
	return (
		<div className={'absolute inset-0'}>
			<AppearanceSettingPage />
		</div>
	);
};

export const LoginPageDemo = () => {
	return (
		<LoginPage
			className={'h-screen w-screen'}
			socials={[]}
			footer={{
				beian: {
					text: '沪ICP备123456号',
				},
			}}
			showoff={
				<Image
					className='absolute inset-0 h-full w-full object-cover'
					src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
					// src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
					alt={'splash'}
				/>
			}
		/>
	);
};
