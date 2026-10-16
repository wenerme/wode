import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardBody, CardContent, CardDescription, CardFigure, CardFooter, CardHeader, CardTitle } from './index';

const meta = { title: 'Primitive/Card', component: Card, tags: ['autodocs'] } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	args: {
		variant: 'border',
		className: 'max-w-md',
		children: (
			<CardBody>
				<CardHeader>
					<CardTitle>阅读清单</CardTitle>
					<CardDescription>用于组织内容的卡片。</CardDescription>
				</CardHeader>
				<CardContent>本周已阅读 3 篇文章。</CardContent>
				<CardFooter>更新于今天</CardFooter>
			</CardBody>
		),
	},
};
export const HorizontalCompact: Story = {
	args: {
		variant: 'dash',
		size: 'sm',
		orientation: 'horizontal',
		className: 'max-w-md',
		children: (
			<>
				<CardFigure className='bg-base-200 w-24 shrink-0'>
					<svg viewBox='0 0 64 64' className='size-16' role='img' aria-label='书本插图'>
						<path d='M12 10h40v44H12zM22 10v44' fill='none' stroke='currentColor' strokeWidth='3' />
					</svg>
				</CardFigure>
				<CardBody>
					<CardTitle>离线资料</CardTitle>
					<CardDescription>紧凑的横向布局</CardDescription>
					<CardContent>12 个本地文件</CardContent>
				</CardBody>
			</>
		),
	},
};
