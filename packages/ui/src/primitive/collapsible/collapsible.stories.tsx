import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';

function CollapsibleExample({ initialOpen = false, disabled = false }: { initialOpen?: boolean; disabled?: boolean }) {
	const [open, setOpen] = useState(initialOpen);
	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			disabled={disabled}
			indicator={initialOpen ? 'plus' : 'arrow'}
			className='w-80'
		>
			<CollapsibleTrigger>高级信息</CollapsibleTrigger>
			<CollapsibleContent>
				<p>文件格式：文本</p>
				<p>字符编码：UTF-8</p>
			</CollapsibleContent>
		</Collapsible>
	);
}
const meta = { title: 'Primitive/Collapsible', component: Collapsible, tags: ['autodocs'] } satisfies Meta<
	typeof Collapsible
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => <CollapsibleExample />,
	play: async ({ canvas, userEvent }) => {
		const trigger = canvas.getByRole('button', { name: '高级信息' });
		await userEvent.click(trigger);
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect(canvas.getByText('字符编码：UTF-8')).toBeVisible();
		await userEvent.click(trigger);
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	},
};
export const InitiallyOpen: Story = { render: () => <CollapsibleExample initialOpen /> };
export const Disabled: Story = { render: () => <CollapsibleExample disabled /> };
