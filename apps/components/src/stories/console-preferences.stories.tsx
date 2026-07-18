import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	BookOpen,
	Box,
	CircleCheck,
	Code2,
	Command,
	Cpu,
	LifeBuoy,
	Monitor,
	Moon,
	PackageCheck,
	ShieldCheck,
	Sun,
	Users,
} from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
	ConsoleAboutClientInfo,
	ConsoleAboutPage,
	ConsoleAboutSection,
	ConsoleDisplaySettingsPanel,
	ConsoleThemeComponentPreview,
	ConsoleThemeController,
	ConsoleThemeDemo,
	ConsoleThemePreviewCard,
	type ConsoleThemePreviewSize,
	type ConsoleThemePreviewTone,
	defaultConsoleThemeOptions,
	getConsoleThemesByColorScheme,
} from '../../registry/default/blocks/console-preferences';

const meta = {
	title: 'Console/Preferences',
	component: ConsoleDisplaySettingsPanel,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Accessible DaisyUI appearance settings with paired themes, searchable catalogs, density, radius, system-aware motion, real component previews, and a reusable About page.',
			},
		},
	},
} satisfies Meta<typeof ConsoleDisplaySettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DisplaySettings: Story = {
	parameters: {
		consoleThemeOwner: 'story',
	},
	render: () => (
		<main className='mx-auto max-w-[96rem] p-4 md:p-6'>
			<h1 className='sr-only'>Console display settings</h1>
			<ConsoleThemeController storageKey='wener-components.preferences-story.v1' />
			<ConsoleDisplaySettingsPanel storageKey='wener-components.preferences-story.v1' />
		</main>
	),
	play: async ({ canvasElement }) => {
		canvasElement.dataset.appearancePlay = 'running';
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '重置' }));

		const systemMode = getRadioBySelector(canvasElement, 'input[name*="theme-mode"][value="system"]');
		systemMode.focus();
		await userEvent.keyboard('{ArrowRight}');
		await expect(canvas.getByRole('radio', { name: '始终亮色' })).toBeChecked();

		await userEvent.click(
			getRadioBySelector(canvasElement, 'input[name*="editing-scheme"][value="dark"]').parentElement!,
		);
		await waitFor(() =>
			expect(getVisiblePreview(canvasElement, 'console-theme-demo')).toHaveAttribute('data-theme', 'dark'),
		);
		await expect(document.documentElement).toHaveAttribute('data-theme', 'wener');

		const search = canvas.getByRole('textbox', { name: '搜索主题' });
		await userEvent.type(search, 'night');
		await userEvent.click(canvas.getByRole('radio', { name: '选择 夜晚 主题' }));
		await waitFor(() =>
			expect(getVisiblePreview(canvasElement, 'console-theme-demo')).toHaveAttribute('data-theme', 'night'),
		);
		await expect(document.documentElement).toHaveAttribute('data-theme', 'wener');

		await userEvent.click(canvas.getByRole('radio', { name: '始终暗色' }));
		await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'night'));

		await userEvent.click(getVisibleRadio(canvasElement, 'Components'));
		const componentPreview = getVisiblePreview(canvasElement, 'console-theme-component-preview');
		await userEvent.selectOptions(within(componentPreview).getByLabelText('尺寸'), 'lg');
		await userEvent.selectOptions(within(componentPreview).getByLabelText('语义色'), 'warning');
		await expect(componentPreview.querySelector('.btn-lg.btn-warning')).toBeInTheDocument();

		await userEvent.click(canvas.getByRole('radio', { name: '紧凑' }));
		await userEvent.click(canvas.getByRole('radio', { name: '圆润' }));
		await userEvent.click(canvas.getByRole('radio', { name: '完整动效' }));
		await expect(document.documentElement).toHaveAttribute('data-density', 'compact');
		await expect(document.documentElement).toHaveAttribute('data-radius', 'rounded');
		await expect(document.documentElement).toHaveAttribute('data-motion-preference', 'full');

		await userEvent.click(canvas.getByRole('button', { name: '重置' }));
		await userEvent.click(
			getRadioBySelector(canvasElement, 'input[name*="editing-scheme"][value="light"]').parentElement!,
		);
		await userEvent.click(canvas.getByRole('button', { name: '清除主题搜索' }));
		await userEvent.click(getVisibleRadio(canvasElement, 'Console'));
		await expect(document.documentElement).toHaveAttribute('data-density', 'comfortable');
		await expect(document.documentElement).toHaveAttribute('data-radius', 'soft');
		canvasElement.ownerDocument.defaultView?.scrollTo({ top: 0, left: 0 });
		canvasElement.dataset.appearancePlay = 'complete';
	},
};

function getRadioBySelector(canvasElement: HTMLElement, selector: string) {
	const radio = canvasElement.querySelector<HTMLInputElement>(selector);
	if (!radio) throw new Error(`Radio ${selector} not found.`);
	return radio;
}

function getVisiblePreview(canvasElement: HTMLElement, slot: string) {
	const preview = [...canvasElement.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)].find(
		(element) => element.getBoundingClientRect().width > 0,
	);
	if (!preview) throw new Error(`Visible ${slot} not found.`);
	return preview;
}

function getVisibleRadio(canvasElement: HTMLElement, name: string) {
	const radio = within(canvasElement)
		.getAllByRole('radio', { name })
		.find((element) => element.parentElement?.getBoundingClientRect().width);
	if (!radio) throw new Error(`Visible radio ${name} not found.`);
	return radio;
}

function ComponentPreviewDemo() {
	const [size, setSize] = useState<ConsoleThemePreviewSize>('sm');
	const [tone, setTone] = useState<ConsoleThemePreviewTone>('primary');
	const theme =
		defaultConsoleThemeOptions.find((option) => option.value === 'corporate') ?? defaultConsoleThemeOptions[0];
	return (
		<main className='mx-auto max-w-4xl p-4 md:p-6'>
			<h1 className='text-base font-semibold'>DaisyUI Component Preview</h1>
			<p className='text-base-content/65 mt-1 text-xs'>Corporate · comfortable · soft</p>
			<ConsoleThemeComponentPreview
				className='mt-4'
				theme={theme}
				size={size}
				tone={tone}
				onSizeChange={setSize}
				onToneChange={setTone}
			/>
		</main>
	);
}

export const ComponentPreview: Story = {
	render: () => <ComponentPreviewDemo />,
};

function ThemeCatalogDemo() {
	const [selectedValue, setSelectedValue] = useState('wener');
	const selectedTheme =
		defaultConsoleThemeOptions.find((theme) => theme.value === selectedValue) ?? defaultConsoleThemeOptions[0];
	return (
		<main className='mx-auto w-full max-w-[96rem] p-4 md:p-6'>
			<header className='border-base-300 border-b pb-4'>
				<h1 className='text-lg font-semibold'>DaisyUI Theme Catalog</h1>
				<p className='text-base-content/65 mt-1 text-sm'>36 个已启用主题的真实组件表现。</p>
			</header>
			<div className='mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]'>
				<div className='min-w-0 space-y-7'>
					{(['light', 'dark'] as const).map((colorScheme) => {
						const themes = getConsoleThemesByColorScheme(defaultConsoleThemeOptions, colorScheme);
						const Icon = colorScheme === 'dark' ? Moon : Sun;
						return (
							<section key={colorScheme}>
								<div className='flex items-center justify-between gap-3'>
									<h2 className='flex items-center gap-2 text-sm font-medium'>
										<Icon className='text-primary size-4' />
										{colorScheme === 'dark' ? '暗色主题' : '亮色主题'}
									</h2>
									<span className='text-base-content/70 text-xs'>{themes.length}</span>
								</div>
								<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
									{themes.map((theme) => (
										<ConsoleThemePreviewCard
											key={theme.value}
											theme={theme}
											name={`catalog-${colorScheme}`}
											selected={selectedValue === theme.value}
											onThemeSelect={(next) => setSelectedValue(next.value)}
										/>
									))}
								</div>
							</section>
						);
					})}
				</div>
				<aside>
					<div className='sticky top-4'>
						<h2 className='text-sm font-medium'>组件预览</h2>
						<ConsoleThemeDemo className='mt-3' theme={selectedTheme} />
					</div>
				</aside>
			</div>
		</main>
	);
}

export const ThemeCatalog: Story = {
	render: () => <ThemeCatalogDemo />,
};

export const About: Story = {
	render: () => (
		<main className='min-h-screen p-5 md:p-8'>
			<ConsoleAboutPage
				logo={<Command className='size-8' />}
				product='Wener Console Components'
				description='面向管理控制台的布局、数据工作区、窗口系统与偏好设置组件集合。'
				version='0.1.0'
				build='2026.07.16 · preview'
				environment='Browser / Edge runtime'
				status={{ label: '运行正常', tone: 'success', icon: <CircleCheck className='size-3' /> }}
				actions={
					<a className='btn btn-outline btn-sm' href='https://example.com/releases' target='_blank' rel='noreferrer'>
						查看更新
					</a>
				}
				details={[
					{
						label: '运行时',
						value: 'React 19 / Waku',
						description: '支持服务端渲染与客户端交互边界。',
						icon: <Cpu className='size-4' />,
					},
					{
						label: '组件协议',
						value: 'shadcn registry v1',
						description: '多文件组件使用明确 target 路径。',
						icon: <PackageCheck className='size-4' />,
					},
					{
						label: '样式系统',
						value: 'Tailwind CSS 4 / DaisyUI 5',
						icon: <Box className='size-4' />,
					},
				]}
				diagnostics={<ConsoleAboutClientInfo />}
				maintainers={[
					{
						name: 'Console Platform Team',
						role: '组件维护与发布',
						href: 'https://example.com/team',
						avatar: <Users className='size-4' />,
					},
				]}
				support={
					<div className='flex items-start gap-3 text-sm'>
						<LifeBuoy className='text-info mt-0.5 size-4 shrink-0' />
						<p className='text-base-content/70 leading-6'>
							遇到安装或兼容问题时，请通过消费应用提供的支持渠道联系维护团队。
						</p>
					</div>
				}
				links={[
					{
						label: 'Registry catalog',
						href: './r/registry.json',
						description: '查看可安装的 block 与 primitive。',
						external: false,
						icon: <BookOpen className='size-4' />,
					},
					{
						label: 'Source repository',
						href: 'https://github.com/wenerme/wode',
						description: '源代码、问题跟踪与版本记录。',
						icon: <Code2 className='size-4' />,
					},
				]}
				footer='Copyright 2026 Wener Console Components. Registry consumers own authentication, data access, and deployment policy.'
			>
				<ConsoleAboutSection
					title='安全边界'
					description='组件只负责呈现与本地交互，不持有应用凭证。'
					icon={<ShieldCheck className='size-4' />}
				>
					<div className='border-base-300 flex items-start gap-3 border-y py-3 text-sm'>
						<Monitor className='text-success mt-0.5 size-4 shrink-0' />
						<p className='text-base-content/70 leading-6'>
							组件不会读取凭证、用户会话或生产数据；这些能力由消费应用注入。
						</p>
					</div>
				</ConsoleAboutSection>
			</ConsoleAboutPage>
		</main>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByRole('heading', { level: 1, name: 'Wener Console Components' })).toBeInTheDocument();
		await expect(canvas.getByText('运行正常')).toBeInTheDocument();
		await userEvent.click(canvas.getByText('查看用户代理'));
		await expect(canvas.getByText(/Mozilla|Storybook|—/)).toBeInTheDocument();
		const source = canvas.getByRole('link', { name: /Source repository/ });
		await expect(source).toHaveAttribute('target', '_blank');
		await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
		await expect(canvas.getByRole('navigation', { name: '资源与文档' })).toBeInTheDocument();
	},
};
