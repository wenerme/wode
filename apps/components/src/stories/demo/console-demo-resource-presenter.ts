import { CONSOLE_DEMO_REFERENCE_DATE, type ConsoleDemoDataset, consoleDemoDataset } from './console-demo-dataset';
import type { DataListPage } from './console-demo-navigation';

export type GeneratedResourcePage = DataListPage;
export type ConsoleDemoResourceListRow = {
	id: string;
	name: string;
	status: string;
	statusTone: 'danger' | 'neutral' | 'success' | 'warning';
	owner: string;
	relationLabel: string;
	relation: string;
	detailLabel: string;
	detail: string;
	updatedAt: string;
};

export type ConsoleDemoResourcePageData = {
	title: string;
	description: string;
	relationColumn: string;
	ownerColumn: string;
	detailColumn: string;
	rows: ConsoleDemoResourceListRow[];
};

export function getConsoleDemoResourcePageData(
	page: GeneratedResourcePage,
	dataset: ConsoleDemoDataset = consoleDemoDataset,
): ConsoleDemoResourcePageData {
	const tenantById = new Map(dataset.tenants.map((record) => [record.id, record]));
	const userById = new Map(dataset.metaUsers.map((record) => [record.id, record]));
	const customerById = new Map(dataset.customers.map((record) => [record.id, record]));
	const getTenant = (id: string) => tenantById.get(id)?.name ?? '未知租户';
	const getUser = (id: string) => userById.get(id)?.name ?? '未知用户';
	const getUserEmail = (id: string) => userById.get(id)?.email ?? '未知邮箱';
	const getCustomer = (id: string) => customerById.get(id)?.name ?? '客户已删除';

	switch (page) {
		case 'account':
			return {
				title: '客户',
				description: '管理客户档案、分层状态与最近往来。',
				relationColumn: '租户',
				ownerColumn: '负责人',
				detailColumn: '行业',
				rows: dataset.customers.map((record) => ({
					id: record.id,
					name: record.name,
					status: customerStatus[record.status].label,
					statusTone: customerStatus[record.status].tone,
					owner: record.owner,
					relationLabel: '所属租户',
					relation: getTenant(record.tenantId),
					detailLabel: '客户行业',
					detail: record.industry,
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
		case 'contact':
			return {
				title: '联系人',
				description: '维护客户联系人、岗位和沟通记录。',
				relationColumn: '客户',
				ownerColumn: '邮箱',
				detailColumn: '职位',
				rows: dataset.contacts.map((record) => ({
					id: record.id,
					name: record.name,
					status: '正常',
					statusTone: 'success',
					owner: record.email,
					relationLabel: '所属客户',
					relation: getCustomer(record.customerId),
					detailLabel: '联系人职位',
					detail: record.role,
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
		case 'order':
			return {
				title: '订单',
				description: '跟踪订单状态、金额与交付进度。',
				relationColumn: '客户',
				ownerColumn: '负责人',
				detailColumn: '金额',
				rows: dataset.orders.map((record) => ({
					id: record.id,
					name: record.name,
					status: orderStatus[record.status].label,
					statusTone: orderStatus[record.status].tone,
					owner: getUser(record.ownerUserId),
					relationLabel: '所属客户',
					relation: getCustomer(record.customerId),
					detailLabel: '订单金额',
					detail: formatAmount(record.amount),
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
		case 'opportunity':
			return {
				title: '商机',
				description: '管理销售阶段、预计收入和下一步行动。',
				relationColumn: '客户',
				ownerColumn: '负责人',
				detailColumn: '预计金额',
				rows: dataset.opportunities.map((record) => ({
					id: record.id,
					name: record.name,
					status: opportunityStage[record.stage].label,
					statusTone: opportunityStage[record.stage].tone,
					owner: getUser(record.ownerUserId),
					relationLabel: '所属客户',
					relation: getCustomer(record.customerId),
					detailLabel: '预计金额',
					detail: formatAmount(record.amount),
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
		case 'lead':
			return {
				title: '线索',
				description: '处理线索来源、评分与转化状态。',
				relationColumn: '公司 / 转化客户',
				ownerColumn: '负责人',
				detailColumn: '评分',
				rows: dataset.leads.map((record) => {
					const converted = record.status === 'converted';
					return {
						id: record.id,
						name: record.name,
						status: leadStatus[record.status].label,
						statusTone: leadStatus[record.status].tone,
						owner: getUser(record.ownerUserId),
						relationLabel: converted ? '已转化客户' : '公司',
						relation: converted ? getCustomer(record.convertedCustomerId) : record.company,
						detailLabel: '线索评分',
						detail: `${record.score} / 100`,
						updatedAt: formatRelativeTime(record.updatedAt),
					};
				}),
			};
		case 'form':
			return {
				title: '表单',
				description: '配置业务表单、发布状态与回收数据。',
				relationColumn: '租户',
				ownerColumn: '负责人',
				detailColumn: '提交数',
				rows: dataset.forms.map((record) => ({
					id: record.id,
					name: record.name,
					status: formStatus[record.status].label,
					statusTone: formStatus[record.status].tone,
					owner: getUser(record.ownerUserId),
					relationLabel: '所属租户',
					relation: getTenant(record.tenantId),
					detailLabel: '提交数量',
					detail: String(record.submissionCount),
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
		case 'admin-user':
			return {
				title: '系统用户',
				description: '管理当前系统中的用户、角色与登录状态。',
				relationColumn: '租户',
				ownerColumn: '邮箱',
				detailColumn: '角色',
				rows: dataset.adminUsers.map((record) => {
					const user = userById.get(record.userId);
					if (!user) throw new Error(`Missing admin user ${record.userId}`);
					return {
						id: record.id,
						name: user.name,
						status: userStatus[user.status].label,
						statusTone: userStatus[user.status].tone,
						owner: user.email,
						relationLabel: '所属租户',
						relation: getTenant(record.tenantId),
						detailLabel: '系统角色',
						detail: roleLabel[record.role],
						updatedAt: formatRelativeTime(record.updatedAt),
					};
				}),
			};
		case 'meta-tenant':
			return {
				title: '租户',
				description: '管理平台租户、套餐与启用状态。',
				relationColumn: '所有者',
				ownerColumn: '所有者邮箱',
				detailColumn: '套餐',
				rows: dataset.tenants.map((record) => ({
					id: record.id,
					name: record.name,
					status: tenantStatus[record.status].label,
					statusTone: tenantStatus[record.status].tone,
					owner: getUserEmail(record.ownerUserId),
					relationLabel: '租户所有者',
					relation: getUser(record.ownerUserId),
					detailLabel: '当前套餐',
					detail: planLabel[record.plan],
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
		case 'meta-user':
			return {
				title: '平台用户',
				description: '跨租户查看用户身份与平台级状态。',
				relationColumn: '租户',
				ownerColumn: '角色',
				detailColumn: '邮箱',
				rows: dataset.metaUsers.map((record) => ({
					id: record.id,
					name: record.name,
					status: userStatus[record.status].label,
					statusTone: userStatus[record.status].tone,
					owner: record.roles.map((role) => metaRoleLabel[role]).join('、'),
					relationLabel: '租户成员关系',
					relation: record.tenantIds.map(getTenant).join('、'),
					detailLabel: '登录邮箱',
					detail: record.email,
					updatedAt: formatRelativeTime(record.updatedAt),
				})),
			};
	}
}

const orderStatus = {
	draft: { label: '草稿', tone: 'neutral' },
	confirmed: { label: '已确认', tone: 'success' },
	delivering: { label: '交付中', tone: 'warning' },
	completed: { label: '已完成', tone: 'success' },
	cancelled: { label: '已取消', tone: 'danger' },
} as const;
const customerStatus = {
	active: { label: '正常', tone: 'success' },
	prospect: { label: '潜在', tone: 'warning' },
	inactive: { label: '停用', tone: 'danger' },
} as const;
const opportunityStage = {
	qualification: { label: '资格确认', tone: 'neutral' },
	proposal: { label: '方案阶段', tone: 'warning' },
	negotiation: { label: '商务谈判', tone: 'warning' },
	won: { label: '已赢单', tone: 'success' },
	lost: { label: '已丢单', tone: 'danger' },
} as const;
const leadStatus = {
	new: { label: '新线索', tone: 'neutral' },
	working: { label: '跟进中', tone: 'warning' },
	qualified: { label: '已验证', tone: 'success' },
	converted: { label: '已转化', tone: 'success' },
	disqualified: { label: '已排除', tone: 'danger' },
} as const;
const formStatus = {
	draft: { label: '草稿', tone: 'neutral' },
	published: { label: '已发布', tone: 'success' },
	archived: { label: '已归档', tone: 'neutral' },
} as const;
const userStatus = {
	active: { label: '正常', tone: 'success' },
	invited: { label: '待接受', tone: 'warning' },
	disabled: { label: '已停用', tone: 'danger' },
} as const;
const tenantStatus = {
	active: { label: '正常', tone: 'success' },
	trial: { label: '试用中', tone: 'warning' },
	suspended: { label: '已暂停', tone: 'danger' },
} as const;
const roleLabel = { owner: '所有者', admin: '管理员', operator: '操作员', auditor: '审计员' } as const;
const metaRoleLabel = { owner: '所有者', admin: '管理员', member: '成员', auditor: '审计员' } as const;
const planLabel = { starter: '基础版', growth: '成长版', enterprise: '企业版' } as const;

function formatAmount(value: number) {
	return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

function formatRelativeTime(timestamp: string) {
	const minutes = Math.max(1, Math.floor((Date.parse(CONSOLE_DEMO_REFERENCE_DATE) - Date.parse(timestamp)) / 60_000));
	if (minutes < 60) return `${minutes} 分钟前`;
	if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`;
	return `${Math.floor(minutes / 1440)} 天前`;
}
