import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './index';

function AccordionExample({ multiple = false }: { multiple?: boolean }) {
	const [value, setValue] = useState<unknown[]>([]);
	return (
		<Accordion value={value} onValueChange={setValue} multiple={multiple} className='w-96 max-w-full'>
			<AccordionItem value='offline' indicator={multiple ? 'plus' : 'arrow'}>
				<AccordionTrigger>可以离线使用吗？</AccordionTrigger>
				<AccordionContent>可以，演示不依赖网络资源。</AccordionContent>
			</AccordionItem>
			<AccordionItem value='save' indicator={multiple ? 'plus' : 'arrow'}>
				<AccordionTrigger>数据保存在哪里？</AccordionTrigger>
				<AccordionContent>仅保存在当前演示的内存中。</AccordionContent>
			</AccordionItem>
			<AccordionItem value='locked' disabled indicator='none'>
				<AccordionTrigger>暂不可用的选项</AccordionTrigger>
				<AccordionContent>此内容不可展开。</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
const meta = { title: 'Primitive/Accordion', component: Accordion, tags: ['autodocs'] } satisfies Meta<
	typeof Accordion
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => <AccordionExample />,
	play: async ({ canvas, userEvent }) => {
		const first = canvas.getByRole('button', { name: '可以离线使用吗？' });
		await userEvent.click(first);
		await expect(first).toHaveAttribute('aria-expanded', 'true');
		await expect(canvas.getByText('可以，演示不依赖网络资源。')).toBeVisible();
		await userEvent.click(canvas.getByRole('button', { name: '数据保存在哪里？' }));
		await expect(first).toHaveAttribute('aria-expanded', 'false');
	},
};
export const Multiple: Story = {
	render: () => <AccordionExample multiple />,
	play: async ({ canvas, userEvent }) => {
		for (const name of ['可以离线使用吗？', '数据保存在哪里？'])
			await userEvent.click(canvas.getByRole('button', { name }));
		for (const name of ['可以离线使用吗？', '数据保存在哪里？'])
			await expect(canvas.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'true');
	},
};
