import {
	createQueryGroup,
	createQueryRule,
	type QueryJsonSchema,
	queryFieldsFromJsonSchema,
} from '@/resource/query-builder';

export const customerSchema: QueryJsonSchema = {
	type: 'object',
	title: '客户',
	properties: {
		status: {
			type: 'string',
			title: '生命周期状态',
			description: '客户当前所处的商业生命周期',
			enum: ['active', 'trial', 'paused'],
			'x-enumNames': ['活跃', '试用', '暂停'],
			'x-query': { order: 1 },
		},
		revenue: {
			type: 'number',
			title: '年收入',
			description: '标准化后的年度收入（美元）',
			'x-query': { order: 2, group: '商务' },
		},
		riskScore: {
			type: 'integer',
			title: '风险评分',
			description: '0 到 100 的内部风险评分',
			'x-query': { order: 3, group: '商务', editor: 'risk-score' },
		},
		ownerId: {
			type: 'string',
			title: '客户负责人',
			description: '负责维护客户关系的成员',
			'x-query': { order: 4, group: '客户关系', editor: 'owner' },
		},
		createdAt: {
			type: 'string',
			format: 'date-time',
			title: '创建时间',
			'x-query': { group: '生命周期' },
		},
		archived: {
			type: 'boolean',
			title: '已归档',
			description: '是否包含已归档客户记录',
			'x-query': { group: '生命周期' },
		},
		profile: {
			type: 'object',
			title: '客户画像',
			properties: {
				country: {
					type: 'string',
					title: '国家或地区',
					enum: ['CN', 'SG', 'US'],
					'x-enumNames': ['中国', '新加坡', '美国'],
				},
				industry: { type: 'string', title: '行业' },
			},
		},
	},
};

export const { fields: customerFields, diagnostics: schemaDiagnostics } = queryFieldsFromJsonSchema(customerSchema);

export const initialQuery = createQueryGroup('customer-root', {
	children: [
		createQueryRule('status-rule', '/status', 'in', ['active', 'trial']),
		createQueryRule('revenue-rule', '/revenue', 'between', [1000, 50000]),
		createQueryGroup('ownership-group', {
			combinator: 'or',
			children: [
				createQueryRule('owner-rule', '/ownerId', 'eq', 'owner-ada'),
				createQueryRule('risk-rule', '/riskScore', 'gte', 60),
			],
		}),
	],
});
