import type { QueryValidationIssue } from './query-state';

export type QueryBuilderMessages = {
	title: string;
	match: string;
	all: string;
	any: string;
	not: string;
	addCondition: string;
	addGroup: string;
	searchFields: string;
	searchValues: string;
	noFields: string;
	chooseField: string;
	chooseOperator: string;
	unavailableOperator: (label: string) => string;
	chooseValue: string;
	selectedCount: (count: number) => string;
	selectedOnly: string;
	clearValues: string;
	trueLabel: string;
	falseLabel: string;
	noValue: string;
	addValue: string;
	removeValue: string;
	rangeStart: string;
	rangeEnd: string;
	collapseGroup: string;
	expandGroup: string;
	duplicate: string;
	remove: string;
	moveUp: string;
	moveDown: string;
	emptyGroup: string;
	invalidQuery: string;
	queryCondition: string;
	unknownField: string;
	unknownOperator: string;
	conditionLabel: (label: string) => string;
	groupLabel: (count: number) => string;
	actionsLabel: (label: string) => string;
	actionLabel: (action: string, target: string) => string;
	validationIssue: (issue: QueryValidationIssue) => string;
	conditionCount: (count: number) => string;
	validationCount: (count: number) => string;
};

export const defaultQueryBuilderMessages: QueryBuilderMessages = {
	title: '筛选条件',
	match: '匹配',
	all: '全部',
	any: '任一',
	not: '排除',
	addCondition: '添加条件',
	addGroup: '添加分组',
	searchFields: '搜索字段',
	searchValues: '搜索值',
	noFields: '没有匹配字段',
	chooseField: '选择字段',
	chooseOperator: '选择操作符',
	unavailableOperator: (label) => `${label}（不可用）`,
	chooseValue: '选择值',
	selectedCount: (count) => `已选 ${count} 项`,
	selectedOnly: '仅看已选',
	clearValues: '清空',
	trueLabel: '是',
	falseLabel: '否',
	noValue: '无需填写值',
	addValue: '添加值',
	removeValue: '移除值',
	rangeStart: '最小值',
	rangeEnd: '最大值',
	collapseGroup: '收起分组',
	expandGroup: '展开分组',
	duplicate: '复制',
	remove: '删除',
	moveUp: '上移',
	moveDown: '下移',
	emptyGroup: '暂无条件',
	invalidQuery: '查询条件结构无效。',
	queryCondition: '查询条件',
	unknownField: '未知字段',
	unknownOperator: '未知操作符',
	conditionLabel: (label) => `${label}条件`,
	groupLabel: (count) => `包含 ${count} 个条件的分组`,
	actionsLabel: (label) => `${label}操作`,
	actionLabel: (action, target) => `${action}：${target}`,
	validationIssue: (issue) => issue.message,
	conditionCount: (count) => `${count} 个条件`,
	validationCount: (count) => `${count} 个问题`,
};
