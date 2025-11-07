import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppearanceSettingPage } from './AppearanceSettingPage';

const meta: Meta<typeof AppearanceSettingPage.Composite> = {
	title: 'pages/AppearanceSettingPage',
	component: AppearanceSettingPage.Composite,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className='h-screen'>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AppearanceSettingPage.Composite>;

export const Default: Story = {
	args: {},
};

export const WithChildren: Story = {
	args: {
		children: (
			<div className='rounded-lg border p-4 text-sm shadow'>
				<p>Additional content goes here</p>
			</div>
		),
	},
};

// Stories for individual components
export const LayoutStory: Story = {
	render: () => {
		return (
			<AppearanceSettingPage.Layout title='Custom Title' action={<button className='btn btn-sm'>Action</button>}>
				<div className='p-4'>
					<p>Layout content goes here</p>
				</div>
			</AppearanceSettingPage.Layout>
		);
	},
};

export const HeaderStory: Story = {
	render: () => {
		return (
			<div className='p-4'>
				<AppearanceSettingPage.Header />
			</div>
		);
	},
};

export const HeaderWithCustomTitleStory: Story = {
	render: () => {
		return (
			<div className='p-4'>
				<AppearanceSettingPage.Header title='Custom Theme Settings' />
			</div>
		);
	},
};

export const ThemeSelectorStory: Story = {
	render: () => {
		return (
			<div className='p-4'>
				<AppearanceSettingPage.ThemeSelector />
			</div>
		);
	},
};

export const PreviewStory: Story = {
	render: () => {
		return (
			<div className='p-4'>
				<AppearanceSettingPage.Preview />
			</div>
		);
	},
};

export const CustomLayoutStory: Story = {
	render: () => {
		return (
			<AppearanceSettingPage.Layout
				title={<AppearanceSettingPage.Header title='Custom Appearance' />}
				action={<button className='btn btn-sm'>Save</button>}
			>
				<AppearanceSettingPage.ThemeSelector />
				<div className='divider'>Preview</div>
				<AppearanceSettingPage.Preview />
			</AppearanceSettingPage.Layout>
		);
	},
};
