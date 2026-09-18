import { Bot, Boxes, CircleDollarSign, Database, Gauge, KeyRound, Network, ShieldCheck, Users } from 'lucide-react';
import type { ConsoleModule } from '@/console/console-shell';
import { Status } from '@/ui/status';

export const demoModules: ConsoleModule[] = [
	{
		key: 'resources',
		title: '资源目录',
		description: '统一查看数据源、队列、对象存储和服务端点。',
		href: '#resources',
		icon: <Boxes className='size-4' />,
		meta: '128 个资源 · 4 个环境',
		status: (
			<Status tone='success' size='xs'>
				正常
			</Status>
		),
	},
	{
		key: 'automation',
		title: '自动化任务',
		description: '管理计划任务、执行记录和失败重试。',
		href: '#automation',
		icon: <Bot className='size-4' />,
		meta: '12 个计划 · 2 个运行中',
	},
	{
		key: 'access',
		title: '访问控制',
		description: '维护成员、角色、API Key 和审计策略。',
		href: '#access',
		icon: <ShieldCheck className='size-4' />,
		meta: '36 个成员 · 8 个角色',
		status: (
			<Status tone='warning' size='xs'>
				2 项待审
			</Status>
		),
	},
	{
		key: 'network',
		title: '网络与端点',
		description: '检查入口、健康状态和区域连接质量。',
		href: '#network',
		icon: <Network className='size-4' />,
		meta: '7 个区域 · 99.98% 可用',
	},
	{
		key: 'billing',
		title: '费用中心',
		description: '比较用量、预算和供应商账单趋势。',
		href: '#billing',
		icon: <CircleDollarSign className='size-4' />,
		meta: '本月预算使用 68%',
	},
	{
		key: 'observability',
		title: '可观测性',
		description: '聚合指标、日志、告警和服务健康。',
		href: '#observability',
		icon: <Gauge className='size-4' />,
		meta: '3 个活跃告警',
		status: (
			<Status tone='danger' size='xs'>
				关注
			</Status>
		),
	},
];

export const shellNav = [
	{ key: 'home', label: '首页', icon: Gauge },
	{ key: 'resources', label: '资源', icon: Database, badge: '128' },
	{ key: 'automation', label: '自动化', icon: Bot, badge: '12' },
	{ key: 'access', label: '访问控制', icon: KeyRound },
	{ key: 'members', label: '成员', icon: Users, badge: '36' },
] as const;
