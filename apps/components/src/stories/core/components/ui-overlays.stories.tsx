import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle, Info, Warning, X, XCircle } from '@phosphor-icons/react';
import { AlertDialog } from '@wener/ui/alert-dialog';
import { Button } from '@wener/ui/button';
import { Drawer } from '@wener/ui/drawer';
import { DropdownMenu } from '@wener/ui/dropdown-menu';
import { Sheet } from '@wener/ui/sheet';
import {
	Toast,
	ToastContent,
	ToastDescription,
	ToastRoot,
	ToastTitle,
	type ToastTone,
	ToastViewport,
	useToastManager,
} from '@wener/ui/toast';
import { Tooltip } from '@wener/ui/tooltip';
import type { ComponentType } from 'react';
import { useEffect as useReactEffect } from 'react';
import { useArgs, useEffect as useStoryEffect, useState } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const syncManagerArgs = !('__vitest_worker__' in globalThis);

type OverlayName = 'none' | 'menu' | 'tooltip' | 'alertDialog' | 'drawer' | 'sheet';
type OverlayArgs = {
	activeOverlay: OverlayName;
	tooltipSide: 'top' | 'right' | 'bottom' | 'left';
	sheetSide: 'top' | 'right' | 'bottom' | 'left';
	drawerModal: boolean;
	sheetModal: boolean;
	toastTone: ToastTone;
};

type SemanticToastSample = {
	tone: Exclude<ToastTone, 'default'>;
	title: string;
	description: string;
	Icon: ComponentType<{ 'aria-hidden'?: boolean | 'true'; className?: string }>;
};

const semanticToastSamples: readonly SemanticToastSample[] = [
	{
		tone: 'info',
		title: '配置已更新',
		description: '新的策略将在下一次刷新时生效。',
		Icon: Info,
	},
	{
		tone: 'success',
		title: '同步已完成',
		description: '全部资源已经更新到最新状态。',
		Icon: CheckCircle,
	},
	{
		tone: 'warning',
		title: '配额即将用尽',
		description: '当前用量已达到套餐限制的 90%。',
		Icon: Warning,
	},
	{
		tone: 'error',
		title: '发布失败',
		description: '远端服务暂时不可用，请稍后重试。',
		Icon: XCircle,
	},
];

function ToastMessage({ closeLabel }: { closeLabel: string }) {
	return (
		<ToastContent>
			<ToastTypeIcon />
			<div className='grid min-w-0 flex-1 gap-1'>
				<ToastTitle />
				<ToastDescription />
			</div>
			<Toast.Close aria-label={closeLabel} title={closeLabel}>
				<X aria-hidden='true' className='size-4' />
				<span className='sr-only'>{closeLabel}</span>
			</Toast.Close>
		</ToastContent>
	);
}

function ToastTypeIcon() {
	return (
		<span className='mt-0.5 inline-flex size-5 shrink-0 items-center justify-center' aria-hidden='true'>
			<Info className='hidden size-5 group-data-[type=info]/toast:block' />
			<CheckCircle className='hidden size-5 group-data-[type=success]/toast:block' />
			<Warning className='hidden size-5 group-data-[type=warning]/toast:block' />
			<XCircle className='hidden size-5 group-data-[type=error]/toast:block' />
		</span>
	);
}

function ToastToneCatalog() {
	const { add, close, toasts } = useToastManager();
	useReactEffect(() => {
		const frame = requestAnimationFrame(() => {
			for (const { tone, title, description } of semanticToastSamples) {
				add({ id: `tone-${tone}`, type: tone, title, description, timeout: 0 });
			}
		});
		return () => {
			cancelAnimationFrame(frame);
			for (const { tone } of semanticToastSamples) close(`tone-${tone}`);
		};
	}, [add, close]);
	const semanticToasts = semanticToastSamples.flatMap((sample) => {
		const toast = toasts.find((item) => item.id === `tone-${sample.tone}`);
		return toast ? [{ ...sample, toast }] : [];
	});

	return (
		<section className='grid gap-3' aria-labelledby='toast-tone-title'>
			<div>
				<h2 id='toast-tone-title' className='font-semibold'>
					语义 Toast
				</h2>
				<p className='text-base-content/65 text-sm'>信息、成功、警告与错误状态使用成对的语义前景色和背景色。</p>
			</div>
			<div className='grid gap-3 sm:grid-cols-2'>
				{semanticToasts.map(({ tone, title, Icon, toast }) => (
					<ToastRoot key={tone} className='group/toast' toast={toast}>
						<ToastContent>
							<Icon aria-hidden='true' className='mt-0.5 size-5 shrink-0' />
							<div className='grid min-w-0 flex-1 gap-1'>
								<ToastTitle />
								<ToastDescription />
							</div>
							<Toast.Close aria-hidden={false} aria-label={`关闭${title}`} title={`关闭${title}`}>
								<X aria-hidden='true' className='size-4' />
								<span className='sr-only'>关闭{title}</span>
							</Toast.Close>
						</ToastContent>
					</ToastRoot>
				))}
			</div>
		</section>
	);
}

function ToastDemo({ tone }: { tone: OverlayArgs['toastTone'] }) {
	const manager = useToastManager();
	return (
		<>
			<Button
				variant='outline'
				onClick={() =>
					manager.add({
						title: '配置已保存',
						description: '新的显示设置已经生效。',
						type: tone === 'default' ? undefined : tone,
					})
				}
			>
				显示 Toast
			</Button>
			<Toast.Portal>
				<ToastViewport>
					{manager.toasts.map((toast) => (
						<ToastRoot key={toast.id} className='group/toast' toast={toast}>
							<ToastMessage closeLabel='关闭通知' />
						</ToastRoot>
					))}
				</ToastViewport>
			</Toast.Portal>
		</>
	);
}

function UiOverlaysCatalog({
	activeOverlay,
	tooltipSide,
	sheetSide,
	drawerModal,
	sheetModal,
	toastTone,
	onOverlayChange,
}: OverlayArgs & {
	onOverlayChange: (overlay: OverlayName) => void;
}) {
	const overlayChange = (overlay: Exclude<OverlayName, 'none'>) => (open: boolean) => {
		onOverlayChange(open ? overlay : 'none');
	};

	return (
		<main className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<div className='border-base-300 bg-base-100 rounded-box mx-auto grid w-full max-w-4xl gap-6 border p-5'>
				<div className='flex flex-wrap gap-3'>
					<DropdownMenu.Root open={activeOverlay === 'menu'} onOpenChange={overlayChange('menu')}>
						<DropdownMenu.Trigger render={<Button />}>操作菜单</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Label>资源操作</DropdownMenu.Label>
								<DropdownMenu.Item>查看详情</DropdownMenu.Item>
								<DropdownMenu.Item>复制标识</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Item className='text-error'>删除</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<Tooltip.Root open={activeOverlay === 'tooltip'} onOpenChange={overlayChange('tooltip')}>
						<Tooltip.Trigger render={<Button variant='outline' />}>悬停提示</Tooltip.Trigger>
						<Tooltip.Content positionerProps={{ side: tooltipSide }}>快捷说明</Tooltip.Content>
					</Tooltip.Root>

					<AlertDialog.Root open={activeOverlay === 'alertDialog'} onOpenChange={overlayChange('alertDialog')}>
						<AlertDialog.Trigger render={<Button variant='destructive' />}>删除资源</AlertDialog.Trigger>
						<AlertDialog.Content>
							<AlertDialog.Header>
								<AlertDialog.Title className='text-lg font-semibold'>确认删除资源？</AlertDialog.Title>
								<AlertDialog.Description className='text-base-content/65 text-sm'>
									此操作无法撤销。
								</AlertDialog.Description>
							</AlertDialog.Header>
							<AlertDialog.Footer>
								<AlertDialog.Close render={<Button variant='outline' />}>取消</AlertDialog.Close>
								<AlertDialog.Close render={<Button variant='destructive' />}>确认删除</AlertDialog.Close>
							</AlertDialog.Footer>
						</AlertDialog.Content>
					</AlertDialog.Root>

					<Drawer.Root open={activeOverlay === 'drawer'} modal={drawerModal} onOpenChange={overlayChange('drawer')}>
						<Drawer.Trigger render={<Button variant='secondary' />}>打开 Drawer</Drawer.Trigger>
						<Drawer.Content>
							<Drawer.Header>
								<Drawer.Title className='text-lg font-semibold'>移动端操作面板</Drawer.Title>
								<Drawer.Description className='text-base-content/65 text-sm'>支持拖动关闭。</Drawer.Description>
							</Drawer.Header>
							<Drawer.Footer>
								<Drawer.Close render={<Button />}>完成</Drawer.Close>
							</Drawer.Footer>
						</Drawer.Content>
					</Drawer.Root>

					<Sheet.Root open={activeOverlay === 'sheet'} modal={sheetModal} onOpenChange={overlayChange('sheet')}>
						<Sheet.Trigger render={<Button variant='outline' />}>打开 Sheet</Sheet.Trigger>
						<Sheet.Content side={sheetSide}>
							<Sheet.Header>
								<Sheet.Title className='text-lg font-semibold'>资源设置</Sheet.Title>
								<Sheet.Description className='text-base-content/65 text-sm'>侧边编辑面板。</Sheet.Description>
							</Sheet.Header>
							<Sheet.Footer>
								<Sheet.Close render={<Button />}>保存</Sheet.Close>
							</Sheet.Footer>
						</Sheet.Content>
					</Sheet.Root>

					<Toast.Provider>
						<ToastDemo tone={toastTone} />
					</Toast.Provider>
				</div>

				<Toast.Provider limit={8}>
					<ToastToneCatalog />
				</Toast.Provider>
			</div>
		</main>
	);
}

function UiOverlayInteractions() {
	return (
		<Toast.Provider>
			<div className='bg-base-100 flex flex-wrap gap-3 p-5'>
				<Sheet.Root>
					<Sheet.Trigger render={<Button variant='outline' />}>打开 Sheet</Sheet.Trigger>
					<Sheet.Content side='right'>
						<Sheet.Header>
							<Sheet.Title className='text-lg font-semibold'>资源设置</Sheet.Title>
							<Sheet.Description className='text-base-content/65 text-sm'>侧边编辑面板。</Sheet.Description>
						</Sheet.Header>
						<Sheet.Footer>
							<Sheet.Close render={<Button />}>保存</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
				<ToastDemo tone='success' />
			</div>
		</Toast.Provider>
	);
}

const meta = {
	id: 'components-ui-overlays',
	title: 'Core/Components/UI Overlays',
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen', controls: { expanded: true } },
	args: {
		activeOverlay: 'none',
		tooltipSide: 'top',
		sheetSide: 'right',
		drawerModal: true,
		sheetModal: true,
		toastTone: 'success',
	},
	argTypes: {
		activeOverlay: {
			control: 'select',
			options: ['none', 'menu', 'tooltip', 'alertDialog', 'drawer', 'sheet'],
			table: { category: 'State' },
		},
		tooltipSide: {
			control: 'inline-radio',
			options: ['top', 'right', 'bottom', 'left'],
			table: { category: 'Tooltip' },
		},
		sheetSide: {
			control: 'inline-radio',
			options: ['top', 'right', 'bottom', 'left'],
			table: { category: 'Sheet' },
		},
		drawerModal: { control: 'boolean', table: { category: 'Modal behavior' } },
		sheetModal: { control: 'boolean', table: { category: 'Modal behavior' } },
		toastTone: {
			control: 'select',
			options: ['default', 'info', 'success', 'warning', 'error'],
			table: { category: 'Toast' },
		},
	},
} satisfies Meta<OverlayArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
	render: function Render() {
		const [args, updateArgs] = useArgs<OverlayArgs>();
		const [activeOverlay, setActiveOverlay] = useState(args.activeOverlay);

		useStoryEffect(() => setActiveOverlay(args.activeOverlay), [args.activeOverlay]);

		return (
			<UiOverlaysCatalog
				{...args}
				activeOverlay={activeOverlay}
				onOverlayChange={(overlay) => {
					setActiveOverlay(overlay);
					if (syncManagerArgs) updateArgs({ activeOverlay: overlay });
				}}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('button', { name: '打开 Sheet' })).toBeVisible();
		await expect(canvas.getByRole('button', { name: '显示 Toast' })).toBeVisible();
		for (const sample of semanticToastSamples) {
			await expect(await canvas.findByText(sample.title)).toBeInTheDocument();
			await expect(canvas.getByRole('button', { name: `关闭${sample.title}` })).toBeInTheDocument();
		}
		const infoClose = canvas.getByRole('button', { name: '关闭配置已更新' });
		await userEvent.click(infoClose);
		await waitFor(() => expect(canvas.queryByText('配置已更新')).not.toBeInTheDocument());
	},
};

export const Interactions: Story = {
	render: () => <UiOverlayInteractions />,
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(document.body);
		const sheetTrigger = canvas.getByRole('button', { name: '打开 Sheet' });

		if (body.queryByRole('dialog')) {
			await userEvent.keyboard('{Escape}');
			await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
		}
		await userEvent.click(sheetTrigger);
		await expect(await body.findByRole('dialog', { name: '资源设置' })).toBeVisible();
		await userEvent.keyboard('{Escape}');
		await waitFor(() => expect(body.queryByRole('dialog', { name: '资源设置' })).not.toBeInTheDocument());
		await expect(sheetTrigger).toHaveFocus();

		await userEvent.click(canvas.getByRole('button', { name: '显示 Toast' }));
		await expect(await body.findByText('配置已保存')).toBeInTheDocument();
		const closeButton = await body.findByLabelText('关闭通知', { selector: 'button' });
		await waitFor(() => expect(closeButton).toBeVisible());
		closeButton.focus();
		await waitFor(() => expect(closeButton).not.toHaveAttribute('aria-hidden', 'true'));
		await userEvent.click(closeButton);
		await waitFor(() => expect(body.queryByText('配置已保存')).not.toBeInTheDocument());
	},
};
