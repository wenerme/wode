import { Mail, MessageSquareText, Phone, UsersRound } from 'lucide-react';
import type { ConsoleRecordActivity, ConsoleRecordRelatedItem } from '@/resource/console-record-detail';

export type ContactRecord = {
	address: string;
	department: string;
	email: string;
	jobTitle: string;
	language: string;
	name: string;
	phone: string;
	wechat: string;
};

export const initialContactRecord: ContactRecord = {
	address: '上海市浦东新区示例路 88 号',
	department: '产品体验中心',
	email: 'contact@example.com',
	jobTitle: '产品设计负责人',
	language: '简体中文',
	name: '林澄',
	phone: '+86 138 0000 0000',
	wechat: 'example-contact',
};

export const contactActivities: ConsoleRecordActivity[] = [
	{
		id: 'meeting',
		title: '完成产品方案会议',
		description: '讨论了权限模型、数据迁移与试点范围。',
		actor: '林洁',
		time: '今天 14:20',
		dateTime: '2026-07-16T14:20:00+08:00',
		icon: <UsersRound className='size-3.5' />,
	},
	{
		id: 'email',
		title: '发送方案与会议纪要',
		description: '已发送第二版方案和下一步工作清单。',
		actor: '林洁',
		time: '昨天 17:45',
		dateTime: '2026-07-15T17:45:00+08:00',
		icon: <Mail className='size-3.5' />,
	},
	{
		id: 'call',
		title: '电话沟通',
		description: '确认采购和信息安全团队将参与下一轮评审。',
		actor: '周远',
		time: '7 月 12 日',
		dateTime: '2026-07-12',
		icon: <Phone className='size-3.5' />,
	},
	{
		id: 'note',
		title: '新增客户备注',
		description: '联系人偏好邮件沟通，避免周一上午安排会议。',
		actor: '系统',
		time: '7 月 10 日',
		dateTime: '2026-07-10',
		icon: <MessageSquareText className='size-3.5' />,
	},
];

export const contactOpportunities: ConsoleRecordRelatedItem[] = [
	{
		id: 'opp-1',
		title: '企业协作平台升级',
		subtitle: '预计成交：2026 年 8 月',
		meta: '负责人：林洁',
		href: '#opportunity',
		status: <span className='badge badge-warning badge-sm'>方案评估</span>,
	},
];

export const contactOrders: ConsoleRecordRelatedItem[] = [
	{
		id: 'order-1',
		title: '年度服务续订',
		subtitle: 'ORD-2026-00318',
		meta: 'CNY 186,000',
		href: '#order',
		status: <span className='badge badge-success badge-sm'>已完成</span>,
	},
];
