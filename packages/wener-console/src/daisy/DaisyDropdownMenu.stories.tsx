import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DaisyDropdownMenu, type DaisyDropdownMenuItem } from './DaisyDropdownMenu';

const meta: Meta<typeof DaisyDropdownMenu.Composite> = {
	title: 'daisy/DaisyDropdownMenu',
	component: DaisyDropdownMenu.Composite,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const basicItems: DaisyDropdownMenuItem[] = [
	{ label: 'Profile', icon: '👤' },
	{ label: 'Settings', icon: '⚙️' },
	{ type: 'separator' },
	{ label: 'Logout', icon: '🚪' },
];

const complexItems: DaisyDropdownMenuItem[] = [
	{ type: 'label', label: 'Account' },
	{ label: 'Profile', icon: '👤' },
	{ label: 'Billing', icon: '💳' },
	{ label: 'Settings', icon: '⚙️' },
	{ type: 'separator' },
	{ type: 'label', label: 'Actions' },
	{ label: 'New Project', icon: '➕' },
	{ label: 'Import', icon: '📥' },
	{ label: 'Export', icon: '📤' },
	{ type: 'separator' },
	{ label: 'Help', icon: '❓' },
	{ label: 'Logout', icon: '🚪' },
];

export const Basic: Story = {
	args: {
		items: basicItems,
		children: <button className='btn'>Menu</button>,
	},
};

export const WithTrigger: Story = {
	render: () => (
		<DaisyDropdownMenu.Composite items={basicItems} trigger={<button className='btn btn-primary'>Open Menu</button>} />
	),
};

export const Complex: Story = {
	args: {
		items: complexItems,
		children: <button className='btn btn-outline'>Actions</button>,
	},
};

export const WithPortal: Story = {
	args: {
		items: basicItems,
		portal: true,
		children: <button className='btn btn-secondary'>Portal Menu</button>,
	},
};

export const CustomTrigger: Story = {
	render: () => (
		<DaisyDropdownMenu.Composite items={basicItems}>
			<div className='avatar'>
				<div className='ring-primary ring-offset-base-100 w-10 rounded-full ring ring-offset-2'>
					<img src='https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp' alt='Avatar' />
				</div>
			</div>
		</DaisyDropdownMenu.Composite>
	),
};

export const ManualComposition: Story = {
	render: () => (
		<DaisyDropdownMenu.Root>
			<DaisyDropdownMenu.Trigger>Manual Menu</DaisyDropdownMenu.Trigger>
			<DaisyDropdownMenu.Portal>
				<DaisyDropdownMenu.Positioner>
					<DaisyDropdownMenu.Popup className='menu menu-sm rounded-box bg-base-200 z-30 w-52'>
						<DaisyDropdownMenu.Item>
							<li>
								<a>Item 1</a>
							</li>
						</DaisyDropdownMenu.Item>
						<DaisyDropdownMenu.Item>
							<li>
								<a>Item 2</a>
							</li>
						</DaisyDropdownMenu.Item>
						<DaisyDropdownMenu.Separator className='bg-base-300 m-[5px] h-px' />
						<DaisyDropdownMenu.Item>
							<li>
								<a>Item 3</a>
							</li>
						</DaisyDropdownMenu.Item>
					</DaisyDropdownMenu.Popup>
				</DaisyDropdownMenu.Positioner>
			</DaisyDropdownMenu.Portal>
		</DaisyDropdownMenu.Root>
	),
};
