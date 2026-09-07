import type { LucideIcon } from 'lucide-react';
import {
	Building2,
	ContactRound,
	FileInput,
	FolderOpen,
	Handshake,
	Home,
	LayoutDashboard,
	ListTodo,
	Settings,
	SlidersHorizontal,
	Target,
	UserCog,
	Users,
} from 'lucide-react';
import { CONSOLE_DEMO_COUNTS } from './console-demo-dataset';

export type DemoModulePage = 'automation' | 'access' | 'members' | 'network' | 'billing' | 'observability';

export type DemoPage =
	| 'home'
	| 'account'
	| 'contact'
	| 'order'
	| 'opportunity'
	| 'lead'
	| 'form'
	| 'files'
	| 'admin-user'
	| 'admin-settings'
	| 'meta-tenant'
	| 'meta-user'
	| 'preferences'
	| 'user-system'
	| 'workspace'
	| 'resources'
	| 'documents'
	| DemoModulePage
	| 'about';

export type RoutedDemoPage = Exclude<DemoPage, 'resources' | 'documents' | DemoModulePage | 'about'>;

export const dataListPages = [
	'account',
	'contact',
	'order',
	'opportunity',
	'lead',
	'form',
	'admin-user',
	'meta-tenant',
	'meta-user',
] as const satisfies readonly DemoPage[];

export type DataListPage = (typeof dataListPages)[number];

export type DemoNavigationItem = {
	icon: LucideIcon;
	key: DemoPage;
	label: string;
	badge?: string;
};

export type DemoTopModule = {
	icon: LucideIcon;
	key: 'console' | 'file' | 'admin' | 'meta-admin';
	label: string;
	pages: readonly DemoNavigationItem[];
	root: DemoPage;
};

const consolePages = [
	{ key: 'home', label: '首页', icon: Home },
	{ key: 'account', label: '客户', icon: Building2, badge: String(CONSOLE_DEMO_COUNTS.customers) },
	{ key: 'contact', label: '联系人', icon: ContactRound, badge: String(CONSOLE_DEMO_COUNTS.contacts) },
	{ key: 'order', label: '订单', icon: ListTodo, badge: String(CONSOLE_DEMO_COUNTS.orders) },
	{ key: 'opportunity', label: '商机', icon: Handshake, badge: String(CONSOLE_DEMO_COUNTS.opportunities) },
	{ key: 'lead', label: '线索', icon: Target, badge: String(CONSOLE_DEMO_COUNTS.leads) },
	{ key: 'form', label: '表单', icon: FileInput, badge: String(CONSOLE_DEMO_COUNTS.forms) },
] as const satisfies readonly DemoNavigationItem[];

const filePages = [{ key: 'files', label: '文件', icon: FolderOpen }] as const satisfies readonly DemoNavigationItem[];

const adminPages = [
	{ key: 'admin-user', label: '用户', icon: Users, badge: String(CONSOLE_DEMO_COUNTS.adminUsers) },
	{ key: 'admin-settings', label: '系统设置', icon: SlidersHorizontal },
] as const satisfies readonly DemoNavigationItem[];

const metaAdminPages = [
	{ key: 'meta-tenant', label: '租户', icon: Building2, badge: String(CONSOLE_DEMO_COUNTS.tenants) },
	{ key: 'meta-user', label: '用户', icon: UserCog, badge: String(CONSOLE_DEMO_COUNTS.metaUsers) },
] as const satisfies readonly DemoNavigationItem[];

export const userSettingsPages = [
	{ key: 'preferences', label: '显示设置', icon: SlidersHorizontal },
	{ key: 'user-system', label: '系统信息', icon: Settings },
] as const satisfies readonly DemoNavigationItem[];

export const routedConsoleModules = [
	{ key: 'console', label: '工作台', icon: LayoutDashboard, root: 'home', pages: consolePages },
	{ key: 'file', label: '文件', icon: FolderOpen, root: 'files', pages: filePages },
	{ key: 'admin', label: '系统管理', icon: Settings, root: 'admin-user', pages: adminPages },
	{ key: 'meta-admin', label: '平台管理', icon: Building2, root: 'meta-tenant', pages: metaAdminPages },
] as const satisfies readonly DemoTopModule[];

export const pagePaths: Record<RoutedDemoPage, string> = {
	home: '/console',
	account: '/console/account',
	contact: '/console/contact',
	order: '/console/order',
	opportunity: '/console/opportunity',
	lead: '/console/lead',
	form: '/console/form',
	files: '/file',
	'admin-user': '/admin',
	'admin-settings': '/admin/settings',
	'meta-tenant': '/meta/admin',
	'meta-user': '/meta/admin/user',
	preferences: '/user/settings',
	'user-system': '/user/settings/system',
	workspace: '/console/window',
};

export const pageTitles: Record<DemoPage, string> = {
	home: '首页',
	account: '客户',
	contact: '联系人',
	order: '订单',
	opportunity: '商机',
	lead: '线索',
	form: '表单',
	files: '文件',
	'admin-user': '用户',
	'admin-settings': '系统设置',
	'meta-tenant': '租户',
	'meta-user': '用户',
	preferences: '显示设置',
	'user-system': '系统信息',
	workspace: '窗口工作区',
	resources: '资源目录',
	documents: '文档中心',
	automation: '自动化',
	access: '访问控制',
	members: '成员',
	network: '网络与端点',
	billing: '费用中心',
	observability: '可观测性',
	about: '关于',
};

export function getActiveTopModule(page: DemoPage): DemoTopModule | undefined {
	if (page === 'workspace') return routedConsoleModules[0];
	return routedConsoleModules.find((module) => module.pages.some((item) => item.key === page));
}

export function getRoutedSidebar(page: DemoPage): readonly DemoNavigationItem[] {
	if (page === 'preferences' || page === 'user-system') return userSettingsPages;
	return getActiveTopModule(page)?.pages ?? consolePages;
}

export function getPageFromPath(pathname: string): RoutedDemoPage {
	return (Object.entries(pagePaths).find(([, path]) => path === pathname)?.[0] as RoutedDemoPage | undefined) ?? 'home';
}

export function getPagePath(page: DemoPage): string {
	return page in pagePaths ? pagePaths[page as RoutedDemoPage] : '/console';
}

export function isDataListPage(page: DemoPage): page is DataListPage {
	return dataListPages.some((candidate) => candidate === page);
}
