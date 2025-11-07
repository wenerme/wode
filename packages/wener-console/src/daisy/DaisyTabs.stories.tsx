import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DaisyTabs } from './DaisyTabs';

const meta: Meta<typeof DaisyTabs.Composite> = {
	title: 'daisy/DaisyTabs',
	component: DaisyTabs.Composite,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicTabs = [
	{
		key: 'tab1',
		label: 'Tab 1',
		content: (
			<div className='p-4'>
				<p>Content for Tab 1</p>
				<p>This is the first tab content.</p>
			</div>
		),
	},
	{
		key: 'tab2',
		label: 'Tab 2',
		content: (
			<div className='p-4'>
				<p>Content for Tab 2</p>
				<p>This is the second tab content.</p>
			</div>
		),
	},
	{
		key: 'tab3',
		label: 'Tab 3',
		content: (
			<div className='p-4'>
				<p>Content for Tab 3</p>
				<p>This is the third tab content.</p>
			</div>
		),
	},
];

const tabsWithIcons = [
	{
		key: 'home',
		label: 'Home',
		icon: '🏠',
		content: (
			<div className='p-4'>
				<h3>Home Dashboard</h3>
				<p>Welcome to your dashboard!</p>
			</div>
		),
	},
	{
		key: 'settings',
		label: 'Settings',
		icon: '⚙️',
		content: (
			<div className='p-4'>
				<h3>Settings</h3>
				<p>Configure your preferences here.</p>
			</div>
		),
	},
	{
		key: 'profile',
		label: 'Profile',
		icon: '👤',
		content: (
			<div className='p-4'>
				<h3>User Profile</h3>
				<p>Manage your profile information.</p>
			</div>
		),
	},
];

export const Basic: Story = {
	args: {
		tabs: basicTabs,
		defaultValue: 'tab1',
	},
};

export const WithIcons: Story = {
	args: {
		tabs: tabsWithIcons,
		defaultValue: 'home',
	},
};

export const Boxed: Story = {
	args: {
		tabs: basicTabs,
		variant: 'boxed',
		defaultValue: 'tab1',
	},
};

export const Bordered: Story = {
	args: {
		tabs: basicTabs,
		variant: 'bordered',
		defaultValue: 'tab1',
	},
};

export const Lifted: Story = {
	args: {
		tabs: basicTabs,
		variant: 'lifted',
		title: 'Page Title',
		defaultValue: 'tab1',
	},
};

export const LiftedWithAction: Story = {
	args: {
		tabs: basicTabs,
		variant: 'lifted',
		title: 'Project Dashboard',
		action: <button className='btn btn-sm btn-primary'>New</button>,
		defaultValue: 'tab1',
	},
};

export const Small: Story = {
	args: {
		tabs: basicTabs,
		size: 'sm',
		variant: 'bordered',
		defaultValue: 'tab1',
	},
};

export const Large: Story = {
	args: {
		tabs: tabsWithIcons,
		size: 'lg',
		variant: 'boxed',
		defaultValue: 'home',
	},
};

export const ManualComposition: Story = {
	render: () => (
		<DaisyTabs.Root defaultValue='manual1' className='w-full'>
			<DaisyTabs.List>
				<DaisyTabs.Tab value='manual1'>Manual Tab 1</DaisyTabs.Tab>
				<DaisyTabs.Tab value='manual2'>Manual Tab 2</DaisyTabs.Tab>
				<DaisyTabs.Tab value='manual3'>Manual Tab 3</DaisyTabs.Tab>
			</DaisyTabs.List>
			<DaisyTabs.Panel value='manual1' className='p-4'>
				<h3>Manually Composed Tab 1</h3>
				<p>This tab was composed manually using individual components.</p>
			</DaisyTabs.Panel>
			<DaisyTabs.Panel value='manual2' className='p-4'>
				<h3>Manually Composed Tab 2</h3>
				<p>Full control over the tab structure and styling.</p>
			</DaisyTabs.Panel>
			<DaisyTabs.Panel value='manual3' className='p-4'>
				<h3>Manually Composed Tab 3</h3>
				<p>Perfect for complex layouts and custom content.</p>
			</DaisyTabs.Panel>
		</DaisyTabs.Root>
	),
};
