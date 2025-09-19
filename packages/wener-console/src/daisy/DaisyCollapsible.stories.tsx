import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DaisyCollapsible } from './DaisyCollapsible';

const meta: Meta<typeof DaisyCollapsible.Root> = {
	title: 'daisy/DaisyCollapsible',
	component: DaisyCollapsible.Root,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
	render: () => (
		<DaisyCollapsible.Root className='w-80'>
			<DaisyCollapsible.Trigger className='collapse-title font-medium'>Click to expand</DaisyCollapsible.Trigger>
			<DaisyCollapsible.Panel className='collapse-content'>
				<p>This content is hidden by default and shown when the collapsible is opened.</p>
			</DaisyCollapsible.Panel>
		</DaisyCollapsible.Root>
	),
};

export const WithArrow: Story = {
	render: () => (
		<DaisyCollapsible.Root className='collapse-arrow bg-base-200 w-80'>
			<DaisyCollapsible.Trigger className='collapse-title text-xl font-medium'>
				Collapsible with Arrow
			</DaisyCollapsible.Trigger>
			<DaisyCollapsible.Panel className='collapse-content'>
				<p>This collapsible has an arrow indicator that rotates when opened/closed.</p>
				<p>It also has a background color applied via DaisyUI classes.</p>
			</DaisyCollapsible.Panel>
		</DaisyCollapsible.Root>
	),
};

export const WithPlus: Story = {
	render: () => (
		<DaisyCollapsible.Root className='collapse-plus bg-base-200 w-80'>
			<DaisyCollapsible.Trigger className='collapse-title text-xl font-medium'>
				Collapsible with Plus
			</DaisyCollapsible.Trigger>
			<DaisyCollapsible.Panel className='collapse-content'>
				<p>This collapsible uses a plus/minus indicator instead of an arrow.</p>
			</DaisyCollapsible.Panel>
		</DaisyCollapsible.Root>
	),
};

export const Multiple: Story = {
	render: () => (
		<div className='w-80 space-y-2'>
			<DaisyCollapsible.Root className='collapse-arrow bg-base-200'>
				<DaisyCollapsible.Trigger className='collapse-title text-xl font-medium'>First Item</DaisyCollapsible.Trigger>
				<DaisyCollapsible.Panel className='collapse-content'>
					<p>Content for the first collapsible item.</p>
				</DaisyCollapsible.Panel>
			</DaisyCollapsible.Root>

			<DaisyCollapsible.Root className='collapse-arrow bg-base-200'>
				<DaisyCollapsible.Trigger className='collapse-title text-xl font-medium'>Second Item</DaisyCollapsible.Trigger>
				<DaisyCollapsible.Panel className='collapse-content'>
					<p>Content for the second collapsible item.</p>
				</DaisyCollapsible.Panel>
			</DaisyCollapsible.Root>

			<DaisyCollapsible.Root className='collapse-arrow bg-base-200'>
				<DaisyCollapsible.Trigger className='collapse-title text-xl font-medium'>Third Item</DaisyCollapsible.Trigger>
				<DaisyCollapsible.Panel className='collapse-content'>
					<p>Content for the third collapsible item.</p>
				</DaisyCollapsible.Panel>
			</DaisyCollapsible.Root>
		</div>
	),
};
