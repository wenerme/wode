import { useState } from 'react';
import { PiChartLineLight, PiGearLight, PiUserLight } from 'react-icons/pi';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs.Composite> = {
	title: 'Components/Tabs',
	component: Tabs.Composite,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
	args: {
		tabs: [
			{
				label: 'Overview',
				content: <div className='p-4'>Overview content</div>,
			},
			{
				label: 'Details',
				content: <div className='p-4'>Details content</div>,
			},
			{
				label: 'Settings',
				content: <div className='p-4'>Settings content</div>,
			},
		],
	},
};

export const WithIcons: Story = {
	args: {
		tabs: [
			{
				label: 'User',
				icon: <PiUserLight />,
				content: (
					<div className='space-y-2 p-4'>
						<h3 className='font-semibold'>User Information</h3>
						<p>Name: John Doe</p>
						<p>Email: john@example.com</p>
					</div>
				),
			},
			{
				label: 'Analytics',
				icon: <PiChartLineLight />,
				content: (
					<div className='space-y-2 p-4'>
						<h3 className='font-semibold'>Analytics Data</h3>
						<p>Views: 1,234</p>
						<p>Clicks: 567</p>
					</div>
				),
			},
			{
				label: 'Settings',
				icon: <PiGearLight />,
				content: (
					<div className='space-y-2 p-4'>
						<h3 className='font-semibold'>Settings Panel</h3>
						<label className='flex items-center gap-2'>
							<input type='checkbox' className='checkbox checkbox-sm' />
							<span>Enable notifications</span>
						</label>
					</div>
				),
			},
		],
	},
};

export const Controlled: Story = {
	render: () => {
		const [activeTab, setActiveTab] = useState('1');

		return (
			<div className='space-y-4'>
				<div className='flex items-center gap-2'>
					<span className='text-sm'>Active tab:</span>
					<code className='bg-base-200 rounded px-2 py-1'>{activeTab}</code>
				</div>
				<Tabs.Composite
					activeTab={activeTab}
					onTabChange={setActiveTab}
					tabs={[
						{
							key: '1',
							label: 'Tab 1',
							content: <div className='p-4'>Content 1</div>,
						},
						{
							key: '2',
							label: 'Tab 2',
							content: <div className='p-4'>Content 2</div>,
						},
						{
							key: '3',
							label: 'Tab 3',
							content: <div className='p-4'>Content 3</div>,
						},
					]}
				/>
			</div>
		);
	},
};

export const Variants: Story = {
	render: () => (
		<div className='w-[600px] space-y-8'>
			<div>
				<h3 className='mb-2 text-sm font-semibold'>Lifted (default)</h3>
				<Tabs.Composite
					variant='lift'
					tabs={[
						{ label: 'Tab 1', content: <div className='bg-base-100 p-4'>Lifted content</div> },
						{ label: 'Tab 2', content: <div className='bg-base-100 p-4'>Content 2</div> },
						{ label: 'Tab 3', content: <div className='bg-base-100 p-4'>Content 3</div> },
					]}
				/>
			</div>

			<div>
				<h3 className='mb-2 text-sm font-semibold'>Bordered</h3>
				<Tabs.Composite
					variant='border'
					tabs={[
						{ label: 'Tab 1', content: <div className='p-4'>Bordered content</div> },
						{ label: 'Tab 2', content: <div className='p-4'>Content 2</div> },
						{ label: 'Tab 3', content: <div className='p-4'>Content 3</div> },
					]}
				/>
			</div>

			<div>
				<h3 className='mb-2 text-sm font-semibold'>Boxed</h3>
				<Tabs.Composite
					variant='box'
					tabs={[
						{ label: 'Tab 1', content: <div className='p-4'>Boxed content</div> },
						{ label: 'Tab 2', content: <div className='p-4'>Content 2</div> },
						{ label: 'Tab 3', content: <div className='p-4'>Content 3</div> },
					]}
				/>
			</div>
		</div>
	),
};

export const WithDisabled: Story = {
	args: {
		tabs: [
			{
				label: 'Active Tab',
				content: <div className='p-4'>This tab is active</div>,
			},
			{
				label: 'Disabled Tab',
				disabled: true,
				content: <div className='p-4'>This content is not accessible</div>,
			},
			{
				label: 'Another Tab',
				content: <div className='p-4'>Another active tab</div>,
			},
		],
	},
};

export const InSummaryPanel: Story = {
	render: () => (
		<div className='flex h-96 w-80 flex-col rounded border'>
			<div className='bg-base-100 flex items-center gap-2 border-b p-2'>
				<h3 className='flex-1 font-semibold'>Order Details</h3>
				<button className='btn btn-circle btn-ghost btn-xs'>×</button>
			</div>

			<div className='bg-base-100 flex items-center gap-2 border-b p-2'>
				<span className='badge badge-success'>已支付</span>
				<span className='badge badge-info'>已发货</span>
			</div>

			<Tabs.Composite
				tabs={[
					{
						label: 'Info',
						icon: <PiUserLight />,
						content: (
							<div className='space-y-2 p-2'>
								<div>
									<label className='text-base-content/60 text-xs'>Order ID</label>
									<p className='font-mono'>#12345</p>
								</div>
								<div>
									<label className='text-base-content/60 text-xs'>Customer</label>
									<p>John Doe</p>
								</div>
								<div>
									<label className='text-base-content/60 text-xs'>Amount</label>
									<p className='font-semibold'>¥1,234.56</p>
								</div>
							</div>
						),
					},
					{
						label: 'Items',
						content: (
							<div className='space-y-2 p-2'>
								<div className='border-b pb-2'>
									<p className='font-semibold'>Product A</p>
									<p className='text-base-content/60 text-sm'>Qty: 2 × ¥500.00</p>
								</div>
								<div className='border-b pb-2'>
									<p className='font-semibold'>Product B</p>
									<p className='text-base-content/60 text-sm'>Qty: 1 × ¥234.56</p>
								</div>
							</div>
						),
					},
				]}
			/>
		</div>
	),
};

export const AutoKeys: Story = {
	render: () => {
		const [activeTab, setActiveTab] = useState<string>('0');

		return (
			<div className='space-y-4'>
				<div className='flex items-center gap-2'>
					<span className='text-sm'>Active tab (auto key):</span>
					<code className='bg-base-200 rounded px-2 py-1'>{activeTab}</code>
				</div>
				<Tabs.Composite
					activeTab={activeTab}
					onTabChange={setActiveTab}
					tabs={[
						{ label: 'First (key: 0)', content: <div className='p-4'>Auto key = 0</div> },
						{ label: 'Second (key: 1)', content: <div className='p-4'>Auto key = 1</div> },
						{ label: 'Third (key: 2)', content: <div className='p-4'>Auto key = 2</div> },
					]}
				/>
			</div>
		);
	},
};

export const WithTitle: Story = {
	render: () => (
		<div className='w-[600px]'>
			<Tabs.Composite
				variant='lift'
				title='My Dashboard'
				tabs={[
					{
						label: 'Overview',
						icon: <PiUserLight />,
						content: <div className='bg-base-100 p-4'>Overview content with title</div>,
					},
					{
						label: 'Analytics',
						icon: <PiChartLineLight />,
						content: <div className='bg-base-100 p-4'>Analytics data</div>,
					},
					{
						label: 'Settings',
						icon: <PiGearLight />,
						content: <div className='bg-base-100 p-4'>Settings panel</div>,
					},
				]}
			/>
		</div>
	),
};

export const WithAction: Story = {
	render: () => (
		<div className='w-[600px]'>
			<Tabs.Composite
				variant='lift'
				title='Orders'
				action={<button className='btn btn-primary btn-sm'>+ New Order</button>}
				tabs={[
					{
						label: 'All',
						content: <div className='bg-base-100 p-4'>All orders</div>,
					},
					{
						label: 'Pending',
						content: <div className='bg-base-100 p-4'>Pending orders</div>,
					},
					{
						label: 'Completed',
						content: <div className='bg-base-100 p-4'>Completed orders</div>,
					},
				]}
			/>
		</div>
	),
};

export const TitleAndAction: Story = {
	render: () => (
		<div className='w-[600px]'>
			<Tabs.Composite
				variant='lift'
				title='Projects'
				action={
					<div className='flex gap-2'>
						<button className='btn btn-ghost btn-sm'>Export</button>
						<button className='btn btn-primary btn-sm'>+ Create</button>
					</div>
				}
				tabs={[
					{
						label: 'Active',
						content: <div className='bg-base-100 p-4'>Active projects</div>,
					},
					{
						label: 'Archived',
						content: <div className='bg-base-100 p-4'>Archived projects</div>,
					},
				]}
			/>
		</div>
	),
};

export const LiftedWithWrap: Story = {
	render: () => (
		<div className='w-[500px]'>
			<Tabs.Composite
				variant='lift'
				title='Dashboard'
				action={
					<div className='flex gap-2'>
						<button className='btn btn-ghost btn-sm'>Refresh</button>
					</div>
				}
				tabs={[
					{
						label: 'Overview',
						icon: <PiUserLight />,
						content: (
							<div className='bg-base-100 h-48 p-4'>Overview with many tabs to demonstrate wrapping behavior</div>
						),
					},
					{
						label: 'Analytics',
						icon: <PiChartLineLight />,
						content: <div className='bg-base-100 h-48 p-4'>Analytics content</div>,
					},
					{
						label: 'Settings',
						icon: <PiGearLight />,
						content: <div className='bg-base-100 h-48 p-4'>Settings content</div>,
					},
					{
						label: 'Reports',
						content: <div className='bg-base-100 h-48 p-4'>Reports content</div>,
					},
					{
						label: 'Users',
						content: <div className='bg-base-100 h-48 p-4'>Users content</div>,
					},
					{
						label: 'Permissions',
						content: <div className='bg-base-100 h-48 p-4'>Permissions content</div>,
					},
				]}
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					'Demonstrates how tabs wrap gracefully when there are many tabs. The title stays in place and does not shift when tabs wrap to a new line.',
			},
		},
	},
};

export const LiftedNoTitle: Story = {
	render: () => (
		<div className='w-[600px]'>
			<Tabs.Composite
				variant='lift'
				action={
					<div className='flex gap-2'>
						<button className='btn btn-ghost btn-sm'>Filter</button>
						<button className='btn btn-primary btn-sm'>+ Add</button>
					</div>
				}
				tabs={[
					{
						label: 'All Items',
						content: <div className='bg-base-100 p-4'>All items view</div>,
					},
					{
						label: 'Favorites',
						content: <div className='bg-base-100 p-4'>Favorites view</div>,
					},
					{
						label: 'Recent',
						content: <div className='bg-base-100 p-4'>Recent items</div>,
					},
				]}
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Lifted variant without title, showing the 4px spacer for a smoother visual appearance.',
			},
		},
	},
};
