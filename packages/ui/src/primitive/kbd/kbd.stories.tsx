import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './index';

const meta = { title: 'Primitive/Kbd', component: Kbd, tags: ['autodocs'] } satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<p>
			保存：<Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>
		</p>
	),
};
export const Sizes: Story = {
	render: () => (
		<div className='flex items-center gap-3'>
			<Kbd size='xs'>Esc</Kbd>
			<Kbd size='sm'>Tab</Kbd>
			<Kbd size='md'>Enter</Kbd>
			<Kbd size='lg'>Shift</Kbd>
			<Kbd size='xl'>Space</Kbd>
		</div>
	),
};
