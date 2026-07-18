import { ArrowUpRight, Building2, ContactRound, FileInput, Handshake, ListTodo, Target, Users } from 'lucide-react';
import type { MouseEvent } from 'react';
import { ConsolePage } from '../../registry/default/blocks/console-shell';
import { Status } from '../../registry/default/ui/status';
import type { DemoPage } from './console-demo-navigation';

const pageDetails = {
	account: ['客户', '管理客户档案、分层状态与最近往来。', ['启明科技', '远山制造', '海岚零售']],
	contact: ['联系人', '维护客户联系人、岗位和沟通记录。', ['林澄', '周屿', '陈安']],
	order: ['订单', '跟踪订单状态、金额与交付进度。', ['ORD-2026-0188', 'ORD-2026-0187', 'ORD-2026-0186']],
	opportunity: ['商机', '管理销售阶段、预计收入和下一步行动。', ['年度云服务续约', '华东门店升级', '数据平台扩容']],
	lead: ['线索', '处理线索来源、评分与转化状态。', ['官网试用申请', '行业峰会名单', '合作伙伴推荐']],
	form: ['表单', '配置业务表单、发布状态与回收数据。', ['客户拜访记录', '销售线索登记', '项目交付验收']],
	'admin-user': ['系统用户', '管理当前系统中的用户、角色与登录状态。', ['林澄', '平台运维', '审计专员']],
	'admin-settings': ['系统设置', '配置认证、通知、数据保留与运行参数。', ['身份认证', '通知策略', '数据保留']],
	'meta-tenant': ['租户', '管理平台租户、套餐与启用状态。', ['示例集团', '演示空间', '测试组织']],
	'meta-user': [
		'平台用户',
		'跨租户查看用户身份与平台级状态。',
		['owner@example.com', 'admin@example.com', 'auditor@example.com'],
	],
} as const;

export type RoutedModulePage = keyof typeof pageDetails;

export function isRoutedModulePage(page: DemoPage): page is RoutedModulePage {
	return Object.hasOwn(pageDetails, page);
}

const pageIcons = {
	account: Building2,
	contact: ContactRound,
	order: ListTodo,
	opportunity: Handshake,
	lead: Target,
	form: FileInput,
	'admin-user': Users,
	'admin-settings': ListTodo,
	'meta-tenant': Building2,
	'meta-user': Users,
} as const;

export function ConsoleRoutedHomeContent({
	hrefForPage,
	onNavigate,
}: {
	hrefForPage: (page: DemoPage) => string;
	onNavigate: (page: DemoPage) => void;
}) {
	const entries = [
		{ page: 'account' as const, label: '客户', value: '128', hint: '本月新增 12', icon: Building2 },
		{ page: 'contact' as const, label: '联系人', value: '356', hint: '待跟进 24', icon: ContactRound },
		{ page: 'order' as const, label: '订单', value: '24', hint: '待交付 6', icon: ListTodo },
		{ page: 'opportunity' as const, label: '商机', value: '18', hint: '预计 ¥2.4M', icon: Handshake },
	];
	return (
		<ConsolePage title='首页' description='客户、销售与交付工作的统一入口。'>
			<div className='border-base-300 bg-base-300 grid gap-px overflow-hidden border-y sm:grid-cols-2 xl:grid-cols-4'>
				{entries.map((entry) => (
					<a
						key={entry.page}
						href={hrefForPage(entry.page)}
						className='bg-base-100 hover:bg-base-200 p-4 text-left'
						onClick={(event) => handleNavigation(event, entry.page, onNavigate)}
					>
						<div className='flex items-center gap-2 text-sm font-medium'>
							<entry.icon className='size-4' />
							{entry.label}
						</div>
						<div className='mt-4 text-2xl font-semibold'>{entry.value}</div>
						<div className='text-base-content/55 mt-1 text-xs'>{entry.hint}</div>
					</a>
				))}
			</div>
			<div className='mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'>
				<section aria-labelledby='console-demo-today-heading' className='border-base-300 border-y py-4'>
					<h2 id='console-demo-today-heading' className='text-sm font-semibold'>
						今日工作
					</h2>
					<div className='divide-base-300 mt-3 divide-y'>
						{['跟进启明科技续约商机', '确认 ORD-2026-0188 交付计划', '处理 6 条高意向线索'].map((item, index) => (
							<div key={item} className='flex items-center gap-3 py-3 text-sm'>
								<Status tone={index === 0 ? 'warning' : 'neutral'} size='xs'>
									{index === 0 ? '优先' : '待办'}
								</Status>
								<span className='flex-1'>{item}</span>
								<ArrowUpRight className='text-base-content/45 size-4' />
							</div>
						))}
					</div>
				</section>
				<section aria-labelledby='console-demo-pipeline-heading' className='border-base-300 border-y py-4'>
					<h2 id='console-demo-pipeline-heading' className='text-sm font-semibold'>
						销售漏斗
					</h2>
					<dl className='mt-3 space-y-3 text-sm'>
						{[
							['线索', '42'],
							['商机', '18'],
							['待签约', '7'],
						].map(([label, value]) => (
							<div key={label} className='flex'>
								<dt className='text-base-content/60 flex-1'>{label}</dt>
								<dd className='font-medium'>{value}</dd>
							</div>
						))}
					</dl>
				</section>
			</div>
		</ConsolePage>
	);
}

function handleNavigation(event: MouseEvent<HTMLAnchorElement>, page: DemoPage, onNavigate: (page: DemoPage) => void) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	event.preventDefault();
	onNavigate(page);
}

export function ConsoleRoutedModuleContent({ page }: { page: RoutedModulePage }) {
	const [title, description, rows] = pageDetails[page];
	const Icon = pageIcons[page];
	return (
		<ConsolePage
			title={title}
			description={description}
			actions={
				<button type='button' className='btn btn-neutral btn-sm'>
					新建{title}
				</button>
			}
		>
			<div className='border-base-300 border-y'>
				<div className='text-base-content/55 border-base-300 grid grid-cols-[minmax(0,1fr)_7rem_6rem] gap-3 border-b px-3 py-2 text-xs'>
					<span>名称</span>
					<span>状态</span>
					<span>更新时间</span>
				</div>
				{rows.map((row, index) => (
					<div
						key={row}
						className='border-base-300 grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-3 border-b px-3 py-3 text-sm last:border-b-0'
					>
						<span className='flex min-w-0 items-center gap-2'>
							<Icon className='text-base-content/55 size-4 shrink-0' />
							<span className='truncate'>{row}</span>
						</span>
						<Status tone={index === 2 ? 'warning' : 'success'} size='xs'>
							{index === 2 ? '待处理' : '正常'}
						</Status>
						<span className='text-base-content/55 text-xs'>{index + 2} 分钟前</span>
					</div>
				))}
			</div>
		</ConsolePage>
	);
}
