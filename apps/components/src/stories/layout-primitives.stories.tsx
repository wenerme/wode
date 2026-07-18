import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HeaderContentFooterLayout } from '../../registry/default/ui/header-content-footer-layout';
import { LeftCenterRightLayout } from '../../registry/default/ui/left-center-right-layout';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../registry/default/ui/resizable';

const meta = {
	title: 'UI/Layout Primitives',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const HeaderContentFooter: Story = {
	render: () => (
		<main className='bg-base-200 h-screen p-4'>
			<HeaderContentFooterLayout
				className='border-base-300 bg-base-100 mx-auto h-full max-w-4xl border'
				header={<header className='border-base-300 shrink-0 border-b px-4 py-3 font-semibold'>任务详情</header>}
				footer={<footer className='border-base-300 shrink-0 border-t px-4 py-2 text-xs'>最近更新：刚刚</footer>}
			>
				<div className='space-y-3 p-4'>
					{Array.from({ length: 18 }, (_, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: Deterministic Story fixture rows have no state.
						<p key={index}>内容行 {index + 1}</p>
					))}
				</div>
			</HeaderContentFooterLayout>
		</main>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('任务详情')).toBeInTheDocument();
		expect(canvas.getByText('最近更新：刚刚')).toBeInTheDocument();
		expect(canvas.getByText('内容行 18')).toBeInTheDocument();
	},
};

export const LeftCenterRight: Story = {
	render: () => (
		<main className='bg-base-200 h-screen p-4'>
			<LeftCenterRightLayout
				aria-label='三段状态栏'
				role='group'
				className='border-base-300 bg-base-100 mx-auto h-10 max-w-4xl border px-3 text-xs'
				left={<span>3 个项目</span>}
				center={<span className='font-medium'>工作区</span>}
				right={
					<span>
						<span aria-hidden='true' className='bg-success block size-2 rounded-full' />
						<span className='sr-only'>已连接</span>
					</span>
				}
			/>
		</main>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const layout = canvas.getByRole('group', { name: '三段状态栏' });
		const center = canvas.getByText('工作区').parentElement;
		expect(canvas.getByText('3 个项目')).toBeInTheDocument();
		expect(canvas.getByText('已连接')).toHaveClass('sr-only');
		expect(center).not.toBeNull();
		const layoutRect = layout.getBoundingClientRect();
		const centerRect = center?.getBoundingClientRect();
		expect(
			Math.abs((centerRect?.x ?? 0) + (centerRect?.width ?? 0) / 2 - (layoutRect.x + layoutRect.width / 2)),
		).toBeLessThanOrEqual(1);
	},
};

export const ResizableWorkspace: Story = {
	render: () => (
		<main className='bg-base-200 h-screen p-4'>
			<div className='border-base-300 bg-base-100 mx-auto h-full max-w-6xl border'>
				<ResizablePanelGroup id='layout-primitives-demo' orientation='horizontal'>
					<ResizablePanel id='navigation' defaultSize='14rem' minSize='10rem' maxSize='24rem'>
						<nav aria-label='示例导航' className='h-full p-3'>
							导航
						</nav>
					</ResizablePanel>
					<ResizableHandle id='navigation-resize' withHandle />
					<ResizablePanel id='content' minSize='18rem'>
						<section className='h-full p-4'>主内容</section>
					</ResizablePanel>
					<ResizableHandle id='details-resize' withHandle />
					<ResizablePanel id='details' defaultSize='20rem' minSize='14rem' maxSize='30rem'>
						<HeaderContentFooterLayout
							className='h-full'
							header={<header className='border-base-300 border-b px-3 py-2 font-medium'>信息</header>}
							footer={<footer className='border-base-300 border-t px-3 py-2 text-xs'>3 个字段</footer>}
						>
							<div className='p-3'>可调整左右区域宽度。</div>
						</HeaderContentFooterLayout>
					</ResizablePanel>
				</ResizablePanelGroup>
			</div>
		</main>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const navigation = canvas.getByRole('navigation', { name: '示例导航' }).parentElement;
		const handle = canvas.getAllByRole('separator')[0];
		expect(navigation).not.toBeNull();
		const initialWidth = navigation?.getBoundingClientRect().width ?? 0;
		const view = canvasElement.ownerDocument.defaultView;
		const idleLine = view?.getComputedStyle(handle);
		expect(idleLine?.width).toBe('2px');
		expect(idleLine?.boxShadow).toBe('none');
		handle.focus();
		await userEvent.keyboard('{ArrowRight}');
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 0) >= 768) {
			await waitFor(() => expect((navigation?.getBoundingClientRect().width ?? 0) > initialWidth).toBe(true));
		} else {
			expect(handle).toHaveFocus();
			expect(handle).toHaveAttribute('aria-valuenow');
		}
	},
};
