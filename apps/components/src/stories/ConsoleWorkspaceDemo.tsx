'use client';

import {
	Bell,
	Box,
	ChevronsLeft,
	ChevronsRight,
	CircleHelp,
	Command,
	Database,
	Info,
	LayoutDashboard,
	Palette,
	PanelRight,
	Search,
	Settings,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import {
	ConsoleAboutPage,
	ConsoleAboutSection,
	ConsoleDisplaySettingsPanel,
	ConsoleThemeController,
} from '../../registry/default/blocks/console-preferences';
import {
	ConsoleActivityItem,
	ConsoleActivityList,
	ConsoleContent,
	ConsoleDock,
	ConsoleHeader,
	ConsoleModuleHome,
	ConsoleNavLink,
	ConsolePage,
	ConsoleRail,
	ConsoleRailLink,
	ConsoleRailSection,
	ConsoleShell,
	ConsoleSidebar,
	ConsoleSidebarFooter,
	ConsoleSidebarHeader,
	ConsoleSidebarNav,
	ConsoleStatus,
} from '../../registry/default/blocks/console-shell';
import {
	ConsoleDocumentsContent,
	ConsoleFilesContent,
	ConsoleWindowWorkspace,
	useConsoleDemoFileSystem,
} from './console-demo-content';
import { ConsoleCrmDemo } from './console-demo-crm';
import {
	ConsoleRoutedHomeContent,
	ConsoleRoutedModuleContent,
	isRoutedModulePage,
} from './console-demo-module-content';
import {
	type DemoModulePage,
	type DemoPage,
	getActiveTopModule,
	getRoutedSidebar,
	pageTitles,
	routedConsoleModules,
	userSettingsPages,
} from './console-demo-navigation';
import { demoModules, shellNav } from './console-fixtures';
import { ConsoleDataViewDemo } from './data-view-demo';

export type { DemoPage } from './console-demo-navigation';

const modulePageContent: Record<DemoModulePage, readonly [string, string]> = {
	automation: ['自动化', '管理计划任务、运行记录、失败重试和执行策略。'],
	access: ['访问控制', '维护角色、API Key、审批规则与审计策略。'],
	members: ['成员', '管理团队成员、邀请状态与模块权限。'],
	network: ['网络与端点', '检查入口、健康状态、区域连接与服务发现。'],
	billing: ['费用中心', '比较用量、预算与供应商账单趋势。'],
	observability: ['可观测性', '聚合指标、日志、告警与服务健康状态。'],
};

export type ConsoleWorkspaceDemoProps = {
	activePage?: DemoPage;
	enableWorkspace?: boolean;
	hrefForPage?: (page: DemoPage) => string;
	initialPage?: DemoPage;
	initialCollapsed?: boolean;
	onPageChange?: (page: DemoPage) => void;
	showUtilityDock?: boolean;
	userName?: string;
};

export function ConsoleWorkspaceDemo({
	activePage,
	enableWorkspace = false,
	hrefForPage = (page) => `#${page}`,
	initialPage = 'home',
	initialCollapsed = false,
	onPageChange,
	showUtilityDock = true,
	userName = 'Wener',
}: ConsoleWorkspaceDemoProps) {
	const [localPage, setLocalPage] = useState<DemoPage>(
		!enableWorkspace && ['workspace', 'documents', 'files'].includes(initialPage) ? 'home' : initialPage,
	);
	const page = activePage ?? localPage;
	const changePage = (next: DemoPage) => {
		if (activePage === undefined) setLocalPage(next);
		onPageChange?.(next);
	};
	const [collapsed, setCollapsed] = useState(initialCollapsed);
	const fileSystem = useConsoleDemoFileSystem(enableWorkspace);
	const activeModule = enableWorkspace ? getActiveTopModule(page) : undefined;
	const navigation = enableWorkspace ? getRoutedSidebar(page) : shellNav;
	const pageTitle = pageTitles[page];
	const userSettingsActive = userSettingsPages.some((item) => item.key === page);
	const SidebarIcon = activeModule?.icon ?? (userSettingsActive ? Settings : Box);
	const sidebarTitle = enableWorkspace
		? userSettingsActive
			? '用户设置'
			: (activeModule?.label ?? '工作台')
		: '平台控制台';

	const navigate = (next: DemoPage) => (event: MouseEvent<HTMLAnchorElement>) => {
		if (!isPlainNavigationEvent(event)) return;
		event.preventDefault();
		changePage(next);
	};
	const modulePage = page in modulePageContent ? (page as DemoModulePage) : undefined;
	const routedModulePage = isRoutedModulePage(page) ? page : undefined;

	return (
		<>
			<ConsoleThemeController storageKey='wener-components.storybook.display-settings.v1' />
			<ConsoleShell
				rail={
					<ConsoleRail>
						<ConsoleRailSection className='mr-1 md:mr-0 md:mb-1'>
							<span
								className='bg-neutral text-neutral-content grid size-10 place-items-center rounded-md'
								title='Wener Console'
							>
								<Command className='size-5' />
							</span>
						</ConsoleRailSection>
						<ConsoleRailSection grow>
							{enableWorkspace ? (
								<>
									{routedConsoleModules.map((module) => (
										<ConsoleRailLink
											key={module.key}
											href={hrefForPage(module.root)}
											label={module.label}
											icon={<module.icon className='size-5' />}
											active={activeModule?.key === module.key}
											onClick={navigate(module.root)}
										/>
									))}
								</>
							) : (
								<>
									<ConsoleRailLink
										href={hrefForPage('home')}
										label='工作台'
										icon={<LayoutDashboard className='size-5' />}
										active={page === 'home'}
										onClick={navigate('home')}
									/>
									<ConsoleRailLink
										href={hrefForPage('resources')}
										label='资源'
										icon={<Database className='size-5' />}
										active={page === 'resources'}
										onClick={navigate('resources')}
									/>
									<ConsoleRailLink
										href={hrefForPage('preferences')}
										label='显示设置'
										icon={<Palette className='size-5' />}
										active={page === 'preferences'}
										onClick={navigate('preferences')}
									/>
								</>
							)}
						</ConsoleRailSection>
						<ConsoleRailSection>
							{enableWorkspace ? (
								<ConsoleRailLink
									href={hrefForPage('preferences')}
									label='用户设置'
									icon={<Settings className='size-5' />}
									active={userSettingsActive}
									onClick={navigate('preferences')}
								/>
							) : (
								<ConsoleRailLink
									href={hrefForPage('about')}
									label='关于'
									icon={<CircleHelp className='size-5' />}
									active={page === 'about'}
									onClick={navigate('about')}
								/>
							)}
						</ConsoleRailSection>
					</ConsoleRail>
				}
				sidebar={
					<ConsoleSidebar collapsed={collapsed}>
						<ConsoleSidebarHeader className={collapsed ? 'justify-center px-0' : undefined}>
							<span className='bg-primary/12 text-primary grid size-8 shrink-0 place-items-center rounded-md'>
								<SidebarIcon className='size-4' />
							</span>
							{collapsed ? null : <span className='truncate text-sm font-semibold'>{sidebarTitle}</span>}
						</ConsoleSidebarHeader>
						<ConsoleSidebarNav>
							{navigation.map((item) => {
								const nextPage = item.key as DemoPage;
								return (
									<ConsoleNavLink
										key={item.key}
										href={hrefForPage(nextPage)}
										label={item.label}
										icon={<item.icon className='size-4' />}
										badge={'badge' in item ? item.badge : undefined}
										collapsed={collapsed}
										active={page === item.key}
										onClick={navigate(nextPage)}
									/>
								);
							})}
						</ConsoleSidebarNav>
						<ConsoleSidebarFooter>
							<button
								type='button'
								aria-label={collapsed ? '展开模块导航' : '收起模块导航'}
								data-tip={collapsed ? '展开模块导航' : undefined}
								className={`text-base-content/65 hover:bg-base-200 flex h-9 w-full items-center justify-center gap-2 rounded-md text-xs ${collapsed ? 'tooltip tooltip-right' : ''}`}
								onClick={() => setCollapsed((value) => !value)}
							>
								{collapsed ? <ChevronsRight className='size-4' /> : <ChevronsLeft className='size-4' />}
								{collapsed ? null : '收起导航'}
							</button>
						</ConsoleSidebarFooter>
					</ConsoleSidebar>
				}
				header={
					<ConsoleHeader
						breadcrumbs={
							enableWorkspace
								? `Wener Console / ${sidebarTitle}`
								: page === 'home' || modulePage
									? 'Wener Console / Platform'
									: undefined
						}
						title={pageTitle}
						actions={
							<>
								<button
									type='button'
									aria-label='全局搜索'
									title='全局搜索'
									className='hover:bg-base-200 grid size-8 place-items-center rounded-md'
								>
									<Search className='size-4' />
								</button>
								<button
									type='button'
									aria-label='通知'
									title='通知'
									className='hover:bg-base-200 relative grid size-8 place-items-center rounded-md'
								>
									<Bell className='size-4' />
									<span className='bg-error absolute top-1.5 right-1.5 size-1.5 rounded-full' />
								</button>
							</>
						}
					>
						{enableWorkspace ? (
							<nav aria-label='当前模块导航' className='order-last flex w-full gap-1 overflow-x-auto pt-1 md:hidden'>
								{navigation.map((item) => {
									const nextPage = item.key as DemoPage;
									return (
										<a
											key={item.key}
											href={hrefForPage(nextPage)}
											aria-current={page === item.key ? 'page' : undefined}
											className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs ${page === item.key ? 'bg-neutral text-neutral-content' : 'hover:bg-base-200 text-base-content/65'}`}
											onClick={navigate(nextPage)}
										>
											<item.icon className='size-3.5' />
											{item.label}
										</a>
									);
								})}
							</nav>
						) : null}
					</ConsoleHeader>
				}
				dock={
					showUtilityDock ? (
						<ConsoleDock>
							<button
								type='button'
								aria-label={`${userName} 用户菜单`}
								title={`${userName} 用户菜单`}
								className='avatar placeholder relative mb-1 grid size-10 place-items-center'
							>
								<span className='bg-neutral text-neutral-content grid size-9 place-items-center rounded-full text-xs font-semibold'>
									{getInitials(userName)}
								</span>
								<span className='border-base-100 bg-success absolute right-0.5 bottom-0.5 size-2.5 rounded-full border-2' />
							</button>
							<button
								type='button'
								aria-label='详情面板'
								title='详情面板'
								className='text-base-content/65 hover:bg-base-200 grid size-10 place-items-center rounded-md'
							>
								<PanelRight className='size-5' />
							</button>
							<div className='flex-1' />
							<ConsoleStatus status='online'>在线</ConsoleStatus>
						</ConsoleDock>
					) : null
				}
			>
				<ConsoleContent className={page === 'workspace' ? 'relative overflow-hidden' : undefined}>
					{page === 'home' && enableWorkspace ? (
						<ConsoleRoutedHomeContent hrefForPage={hrefForPage} onNavigate={changePage} />
					) : null}
					{page === 'home' && !enableWorkspace ? (
						<HomeContent hrefForPage={hrefForPage} onNavigate={changePage} />
					) : null}
					{enableWorkspace && page === 'workspace' ? <ConsoleWindowWorkspace fileSystem={fileSystem} /> : null}
					{page === 'resources' ? <ResourcesContent /> : null}
					{enableWorkspace && page === 'documents' ? <ConsoleDocumentsContent /> : null}
					{enableWorkspace && page === 'files' ? <ConsoleFilesContent fileSystem={fileSystem} /> : null}
					{enableWorkspace && (page === 'account' || page === 'contact') ? <ConsoleCrmDemo page={page} /> : null}
					{enableWorkspace && routedModulePage && page !== 'account' && page !== 'contact' ? (
						<ConsoleRoutedModuleContent page={routedModulePage} />
					) : null}
					{modulePage ? <ModuleContent page={modulePage} /> : null}
					{page === 'preferences' ? <PreferencesContent /> : null}
					{page === 'about' ? <AboutContent /> : null}
					{page === 'user-system' ? <AboutContent title='系统信息' /> : null}
				</ConsoleContent>
			</ConsoleShell>
		</>
	);
}

function getInitials(name: string) {
	const characters = Array.from(name.trim());
	return characters.length > 0 ? characters.slice(0, 2).join('').toUpperCase() : '用户';
}

function HomeContent({
	hrefForPage,
	onNavigate,
}: {
	hrefForPage: (page: DemoPage) => string;
	onNavigate: (page: DemoPage) => void;
}) {
	const modules = demoModules.map((module) => ({ ...module, href: hrefForPage(module.key as DemoPage) }));
	return (
		<ConsolePage eyebrow='Platform' title='工作台' description='跨环境资源、自动化任务与访问策略的统一入口。'>
			<ConsoleModuleHome
				modules={modules}
				description='按工作域进入常用功能，模块数量可由权限和部署能力动态决定。'
				onModuleSelect={(module, event) => {
					const next = module.key as DemoPage;
					if ((next === 'resources' || next in modulePageContent) && isPlainNavigationEvent(event)) {
						event.preventDefault();
						onNavigate(next);
					}
				}}
				activity={
					<ConsoleActivityList>
						<ConsoleActivityItem
							icon={<Database className='size-4' />}
							title='core-postgres 健康检查恢复'
							description='Platform · cn-shanghai'
							time='2 分钟前'
						/>
						<ConsoleActivityItem
							icon={<Settings className='size-4' />}
							title='自动化任务 nightly-catalog 已完成'
							description='执行 1m 28s · 0 个错误'
							time='18 分钟前'
						/>
						<ConsoleActivityItem
							icon={<Info className='size-4' />}
							title='安全策略版本更新为 v18'
							description='Security · 需要 2 人确认'
							time='1 小时前'
						/>
					</ConsoleActivityList>
				}
			>
				<div>
					<h3 className='text-sm font-semibold'>运行摘要</h3>
					<dl className='divide-base-300 border-base-300 mt-3 divide-y border-y text-sm'>
						{[
							['服务健康', '24 / 25'],
							['今日任务', '186'],
							['待处理告警', '3'],
						].map(([label, value]) => (
							<div key={label} className='flex items-center gap-3 py-2.5'>
								<dt className='text-base-content/65 flex-1'>{label}</dt>
								<dd className='font-medium'>{value}</dd>
							</div>
						))}
					</dl>
				</div>
			</ConsoleModuleHome>
		</ConsolePage>
	);
}

function isPlainNavigationEvent(event: MouseEvent<HTMLAnchorElement>) {
	return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function ResourcesContent() {
	return (
		<ConsolePage title='资源目录' description='可搜索、筛选并查看服务资源的当前状态。'>
			<ConsoleDataViewDemo embedded />
		</ConsolePage>
	);
}

function ModuleContent({ page }: { page: DemoModulePage }) {
	const content = modulePageContent[page];
	return (
		<ConsolePage eyebrow='Platform module' title={content[0]} description={content[1]}>
			<div className='border-base-300 bg-base-100 border-y py-5'>
				<div className='text-sm font-medium'>模块概览</div>
				<p className='text-base-content/70 mt-1 text-sm leading-6'>
					此 Story 验证 Shell 的模块切换 contract；具体领域数据与路由由消费应用注入。
				</p>
			</div>
		</ConsolePage>
	);
}

function PreferencesContent() {
	return (
		<ConsolePage title='显示设置' description='偏好会实时应用到 Console Shell 和数据视图。'>
			<ConsoleDisplaySettingsPanel storageKey='wener-components.storybook.display-settings.v1' />
		</ConsolePage>
	);
}

function AboutContent({ title = '关于' }: { title?: string }) {
	return (
		<ConsolePage title={title}>
			<ConsoleAboutPage
				logo={<Command className='size-7' />}
				product='Wener Console Components'
				description='面向管理控制台的 shadcn-compatible layout 与交互模式。'
				version='0.1.0'
				build='storybook-local'
				environment={<span className='badge badge-success badge-sm'>Development</span>}
				details={[
					{ label: '运行时', value: 'React 19 / Waku' },
					{ label: '样式', value: 'Tailwind CSS 4 / DaisyUI 5' },
				]}
				links={[
					{ label: 'Registry catalog', href: './r/registry.json' },
					{ label: 'Source repository', href: 'https://github.com/wenerme/wode' },
				]}
			>
				<ConsoleAboutSection title='组件边界' description='业务集成由应用层拥有。'>
					<p className='text-base-content/70 text-sm leading-6'>
						Shell 不绑定路由，DataView 不绑定查询 store，Window 不内置桌面运行时。
					</p>
				</ConsoleAboutSection>
			</ConsoleAboutPage>
		</ConsolePage>
	);
}
