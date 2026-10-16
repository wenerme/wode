import type { Meta, StoryObj } from '@storybook/react-vite';
import { Diff } from './index';

const meta = {
	title: 'Primitive/Diff',
	component: Diff,
	tags: ['autodocs'],
	parameters: {
		docs: { description: { component: 'CSS 对比容器。拖动分隔线查看两侧；当前 API 不提供受控比例或键盘调节回调。' } },
	},
} satisfies Meta<typeof Diff>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<Diff className='aspect-video w-96 max-w-full' aria-label='修改前后对比'>
			<Diff.Item1 aria-label='修改后'>
				<div className='bg-primary text-primary-content grid size-full place-items-center text-4xl'>修改后</div>
			</Diff.Item1>
			<Diff.Item2 aria-label='修改前'>
				<div className='bg-base-200 grid size-full place-items-center text-4xl'>修改前</div>
			</Diff.Item2>
			<Diff.Resizer />
		</Diff>
	),
};
export const SquareArtwork: Story = {
	render: () => (
		<Diff className='aspect-square w-72' aria-label='圆形与方形插图对比'>
			<Diff.Item1 aria-label='圆形插图'>
				<svg viewBox='0 0 100 100' className='bg-base-200 size-full' aria-hidden='true'>
					<circle cx='50' cy='50' r='32' fill='currentColor' />
				</svg>
			</Diff.Item1>
			<Diff.Item2 aria-label='方形插图'>
				<svg viewBox='0 0 100 100' className='bg-base-100 size-full' aria-hidden='true'>
					<rect x='18' y='18' width='64' height='64' fill='currentColor' />
				</svg>
			</Diff.Item2>
			<Diff.Resizer />
		</Diff>
	),
};
