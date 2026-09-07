import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@wener/ui/accordion';
import {
	Breadcrumb,
	BreadcrumbChevronSeparator,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
} from '@wener/ui/breadcrumb';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@wener/ui/collapsible';
import { Menu, MenuItem, MenuTitle } from '@wener/ui/menu';
import { Pagination, PaginationButton, PaginationItem, PaginationList } from '@wener/ui/pagination';
import { Tabs } from '@wener/ui/tabs';
import { useArgs, useEffect, useState } from 'storybook/preview-api';
import { expect, userEvent, waitFor, within } from 'storybook/test';

const syncManagerArgs = !('__vitest_worker__' in globalThis);

type StructureArgs = {
	activeTab: 'overview' | 'events';
	tabsVariant: 'default' | 'box' | 'border' | 'lift';
	tabsPlacement: 'top' | 'bottom';
	openPanels: 'none' | 'runtime' | 'network' | 'both';
	collapsibleOpen: boolean;
	collapsibleIndicator: 'none' | 'arrow' | 'plus';
	menuSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	activePage: 1 | 2;
};

function panelValues(openPanels: StructureArgs['openPanels']) {
	switch (openPanels) {
		case 'runtime':
			return ['runtime'];
		case 'network':
			return ['network'];
		case 'both':
			return ['runtime', 'network'];
		default:
			return [];
	}
}

function panelSelection(values: string[]): StructureArgs['openPanels'] {
	if (values.includes('runtime') && values.includes('network')) return 'both';
	if (values.includes('runtime')) return 'runtime';
	if (values.includes('network')) return 'network';
	return 'none';
}

function UiStructureCatalog({
	activeTab,
	tabsVariant,
	tabsPlacement,
	openPanels,
	collapsibleOpen,
	collapsibleIndicator,
	menuSize,
	activePage,
	onActiveTabChange,
	onOpenPanelsChange,
	onCollapsibleOpenChange,
	onActivePageChange,
}: StructureArgs & {
	onActiveTabChange: (value: StructureArgs['activeTab']) => void;
	onOpenPanelsChange: (value: StructureArgs['openPanels']) => void;
	onCollapsibleOpenChange: (open: boolean) => void;
	onActivePageChange: (page: StructureArgs['activePage']) => void;
}) {
	return (
		<main className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<div className='border-base-300 bg-base-100 rounded-box mx-auto grid w-full max-w-4xl gap-8 border p-5'>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='#'>工作台</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbChevronSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href='#'>资源</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbChevronSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>集群 A</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className='grid gap-6 md:grid-cols-[14rem_1fr]'>
					<Menu size={menuSize} className='bg-base-200 rounded-box w-full'>
						<MenuTitle>导航</MenuTitle>
						<MenuItem active>
							<button type='button'>概览</button>
						</MenuItem>
						<MenuItem>
							<button type='button'>实例</button>
						</MenuItem>
						<MenuItem>
							<button type='button'>配置</button>
						</MenuItem>
					</Menu>

					<div className='grid gap-5'>
						<Tabs.Root
							value={activeTab}
							onValueChange={(value) => onActiveTabChange(value as StructureArgs['activeTab'])}
						>
							<Tabs.List variant={tabsVariant} placement={tabsPlacement}>
								<Tabs.Trigger value='overview'>概览</Tabs.Trigger>
								<Tabs.Trigger value='events'>事件</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content value='overview' className='pt-4'>
								当前资源运行正常。
							</Tabs.Content>
							<Tabs.Content value='events' className='pt-4'>
								暂无新事件。
							</Tabs.Content>
						</Tabs.Root>

						<Accordion
							value={panelValues(openPanels)}
							multiple={openPanels === 'both'}
							onValueChange={(values) => onOpenPanelsChange(panelSelection(values.map(String)))}
						>
							<AccordionItem value='runtime'>
								<AccordionTrigger>运行时配置</AccordionTrigger>
								<AccordionContent>配置由应用 adapter 注入，组件不直接请求服务。</AccordionContent>
							</AccordionItem>
							<AccordionItem value='network'>
								<AccordionTrigger>网络策略</AccordionTrigger>
								<AccordionContent>默认仅允许受控出口。</AccordionContent>
							</AccordionItem>
						</Accordion>

						<Collapsible open={collapsibleOpen} indicator={collapsibleIndicator} onOpenChange={onCollapsibleOpenChange}>
							<CollapsibleTrigger>高级选项</CollapsibleTrigger>
							<CollapsibleContent>这里只展示低频配置。</CollapsibleContent>
						</Collapsible>
					</div>
				</div>

				<Pagination>
					<PaginationList>
						<PaginationItem>
							<PaginationButton>上一页</PaginationButton>
						</PaginationItem>
						<PaginationItem>
							<PaginationButton active={activePage === 1} onClick={() => onActivePageChange(1)}>
								1
							</PaginationButton>
						</PaginationItem>
						<PaginationItem>
							<PaginationButton active={activePage === 2} onClick={() => onActivePageChange(2)}>
								2
							</PaginationButton>
						</PaginationItem>
						<PaginationItem>
							<PaginationButton>下一页</PaginationButton>
						</PaginationItem>
					</PaginationList>
				</Pagination>
			</div>
		</main>
	);
}

function UiStructureInteractions() {
	return (
		<div className='bg-base-100 grid max-w-2xl gap-5 p-5'>
			<Tabs.Root defaultValue='overview'>
				<Tabs.List variant='box'>
					<Tabs.Trigger value='overview'>概览</Tabs.Trigger>
					<Tabs.Trigger value='events'>事件</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value='overview' className='pt-4'>
					当前资源运行正常。
				</Tabs.Content>
				<Tabs.Content value='events' className='pt-4'>
					暂无新事件。
				</Tabs.Content>
			</Tabs.Root>

			<Accordion defaultValue={['runtime']}>
				<AccordionItem value='runtime'>
					<AccordionTrigger>运行时配置</AccordionTrigger>
					<AccordionContent>配置由应用 adapter 注入，组件不直接请求服务。</AccordionContent>
				</AccordionItem>
				<AccordionItem value='network'>
					<AccordionTrigger>网络策略</AccordionTrigger>
					<AccordionContent>默认仅允许受控出口。</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

const meta = {
	id: 'components-ui-structure',
	title: 'Core/Components/UI Structure',
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen', controls: { expanded: true } },
	args: {
		activeTab: 'overview',
		tabsVariant: 'box',
		tabsPlacement: 'top',
		openPanels: 'runtime',
		collapsibleOpen: false,
		collapsibleIndicator: 'plus',
		menuSize: 'md',
		activePage: 1,
	},
	argTypes: {
		activeTab: {
			control: 'inline-radio',
			options: ['overview', 'events'],
			table: { category: 'Tabs' },
		},
		tabsVariant: {
			control: 'inline-radio',
			options: ['default', 'box', 'border', 'lift'],
			table: { category: 'Tabs' },
		},
		tabsPlacement: {
			control: 'inline-radio',
			options: ['top', 'bottom'],
			table: { category: 'Tabs' },
		},
		openPanels: {
			control: 'inline-radio',
			options: ['none', 'runtime', 'network', 'both'],
			table: { category: 'Disclosure' },
		},
		collapsibleOpen: { control: 'boolean', table: { category: 'Disclosure' } },
		collapsibleIndicator: {
			control: 'inline-radio',
			options: ['none', 'arrow', 'plus'],
			table: { category: 'Disclosure' },
		},
		menuSize: {
			control: 'select',
			options: ['xs', 'sm', 'md', 'lg', 'xl'],
			table: { category: 'Navigation' },
		},
		activePage: {
			control: 'inline-radio',
			options: [1, 2],
			table: { category: 'Navigation' },
		},
	},
} satisfies Meta<StructureArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
	render: function Render() {
		const [args, updateArgs] = useArgs<StructureArgs>();
		const [activeTab, setActiveTab] = useState(args.activeTab);
		const [openPanels, setOpenPanels] = useState(args.openPanels);
		const [collapsibleOpen, setCollapsibleOpen] = useState(args.collapsibleOpen);
		const [activePage, setActivePage] = useState(args.activePage);

		useEffect(() => setActiveTab(args.activeTab), [args.activeTab]);
		useEffect(() => setOpenPanels(args.openPanels), [args.openPanels]);
		useEffect(() => setCollapsibleOpen(args.collapsibleOpen), [args.collapsibleOpen]);
		useEffect(() => setActivePage(args.activePage), [args.activePage]);

		return (
			<UiStructureCatalog
				{...args}
				activeTab={activeTab}
				openPanels={openPanels}
				collapsibleOpen={collapsibleOpen}
				activePage={activePage}
				onActiveTabChange={(value) => {
					setActiveTab(value);
					if (syncManagerArgs) updateArgs({ activeTab: value });
				}}
				onOpenPanelsChange={(value) => {
					setOpenPanels(value);
					if (syncManagerArgs) updateArgs({ openPanels: value });
				}}
				onCollapsibleOpenChange={(open) => {
					setCollapsibleOpen(open);
					if (syncManagerArgs) updateArgs({ collapsibleOpen: open });
				}}
				onActivePageChange={(page) => {
					setActivePage(page);
					if (syncManagerArgs) updateArgs({ activePage: page });
				}}
			/>
		);
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('当前资源运行正常。')).toBeVisible();
		await expect(canvas.getByText('配置由应用 adapter 注入，组件不直接请求服务。')).toBeVisible();

		const breadcrumb = canvas.getByRole('navigation', { name: '面包屑导航' });
		const list = breadcrumb.querySelector('[data-slot=breadcrumb-list]');
		expect(list).not.toBeNull();
		const children = [...(list?.children ?? [])];
		expect(children).toHaveLength(5);
		expect(children.every((child) => child.tagName === 'LI')).toBe(true);
		expect(breadcrumb.querySelectorAll('[data-slot=breadcrumb-separator]')).toHaveLength(2);
		const centers = children.map((child) => {
			const rect = child.getBoundingClientRect();
			return rect.top + rect.height / 2;
		});
		expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(1);
	},
};

export const Interactions: Story = {
	render: () => <UiStructureInteractions />,
	parameters: { controls: { disable: true } },
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('tab', { name: '事件' }));
		await waitFor(() => expect(canvas.getByText('暂无新事件。')).toBeVisible());

		await userEvent.click(canvas.getByRole('button', { name: '网络策略' }));
		await waitFor(() => expect(canvas.getByText('默认仅允许受控出口。')).toBeVisible());
	},
};
