import { en, Faker, zh_CN } from '@faker-js/faker';
import type { ZodType } from 'zod';
import {
	type AdminUserRecord,
	type ContactRecord,
	type CustomerRecord,
	consoleDemoResourceSchemas,
	type FormRecord,
	type LeadRecord,
	type MetaUserRecord,
	type OpportunityRecord,
	type OrderRecord,
	type TenantRecord,
} from './console-demo-resource-schema';

export const CONSOLE_DEMO_DATASET_SEED = 20260720;
export const CONSOLE_DEMO_REFERENCE_DATE = '2026-07-20T08:00:00.000Z';
export const CONSOLE_DEMO_SEED_VERSION = 'faker-v1';
export const CONSOLE_DEMO_COUNTS = {
	customers: 128,
	contacts: 356,
	orders: 24,
	opportunities: 18,
	leads: 42,
	forms: 16,
	adminUsers: 36,
	tenants: 8,
	metaUsers: 186,
} as const;

export type ConsoleDemoDataset = {
	tenants: TenantRecord[];
	metaUsers: MetaUserRecord[];
	adminUsers: AdminUserRecord[];
	customers: CustomerRecord[];
	contacts: ContactRecord[];
	opportunities: OpportunityRecord[];
	orders: OrderRecord[];
	leads: LeadRecord[];
	forms: FormRecord[];
};

export type ConsoleDemoDatasetOptions = {
	seed?: number;
};

export function createConsoleDemoDataset(options: ConsoleDemoDatasetOptions = {}): ConsoleDemoDataset {
	const seed = options.seed ?? CONSOLE_DEMO_DATASET_SEED;
	const counts = CONSOLE_DEMO_COUNTS;
	const tenantIds = Array.from({ length: counts.tenants }, (_, index) => identifier('tenant', index));
	const metaUsers = createMetaUsers(seed, counts.metaUsers, tenantIds);
	const tenants = createTenants(seed, tenantIds, metaUsers);
	const usersByTenant = groupUsersByTenant(metaUsers);
	const adminUsers = createAdminUsers(seed, counts.adminUsers, metaUsers);
	const customers = createCustomers(seed, counts.customers, tenantIds, usersByTenant);
	const contacts = createContacts(seed, counts.contacts, customers);
	const opportunities = createOpportunities(seed, counts.opportunities, customers, usersByTenant);
	const orders = createOrders(seed, counts.orders, customers, contacts, opportunities, usersByTenant);
	const leads = createLeads(seed, counts.leads, tenantIds, usersByTenant, customers, contacts, opportunities);
	const forms = createForms(seed, counts.forms, tenantIds, usersByTenant);
	return validateConsoleDemoDataset({
		tenants,
		metaUsers,
		adminUsers,
		customers,
		contacts,
		opportunities,
		orders,
		leads,
		forms,
	});
}

export function validateConsoleDemoDataset(dataset: ConsoleDemoDataset): ConsoleDemoDataset {
	const collections = {
		tenant: dataset.tenants,
		metaUser: dataset.metaUsers,
		adminUser: dataset.adminUsers,
		customer: dataset.customers,
		contact: dataset.contacts,
		opportunity: dataset.opportunities,
		order: dataset.orders,
		lead: dataset.leads,
		form: dataset.forms,
	} as const;
	for (const [kind, records] of Object.entries(collections)) {
		const result = (consoleDemoResourceSchemas[kind as keyof typeof consoleDemoResourceSchemas] as ZodType)
			.array()
			.safeParse(records);
		if (!result.success) throw new Error(`Invalid ${kind} mock data: ${result.error.message}`);
		assertUnique(records, kind);
	}

	const tenantById = indexById(dataset.tenants);
	const userById = indexById(dataset.metaUsers);
	const customerById = indexById(dataset.customers);
	const contactById = indexById(dataset.contacts);
	const opportunityById = indexById(dataset.opportunities);
	for (const tenant of dataset.tenants) {
		const owner = requireRecord(userById, tenant.ownerUserId, `tenant ${tenant.id} owner`);
		if (!owner.tenantIds.includes(tenant.id)) throw new Error(`Tenant ${tenant.id} owner membership mismatch`);
	}
	for (const user of dataset.metaUsers) {
		for (const tenantId of user.tenantIds) requireRecord(tenantById, tenantId, `user ${user.id} tenant`);
	}
	for (const admin of dataset.adminUsers) {
		const user = requireRecord(userById, admin.userId, `admin ${admin.id} user`);
		requireRecord(tenantById, admin.tenantId, `admin ${admin.id} tenant`);
		if (!user.tenantIds.includes(admin.tenantId)) throw new Error(`Admin ${admin.id} tenant membership mismatch`);
	}
	for (const customer of dataset.customers) {
		requireRecord(tenantById, customer.tenantId, `customer ${customer.id} tenant`);
		const owner = requireRecord(userById, customer.ownerUserId, `customer ${customer.id} owner`);
		if (!owner.tenantIds.includes(customer.tenantId)) throw new Error(`Customer ${customer.id} owner tenant mismatch`);
		if (owner.name !== customer.owner) throw new Error(`Customer ${customer.id} owner name mismatch`);
	}
	for (const contact of dataset.contacts) {
		const customer = requireRecord(customerById, contact.customerId, `contact ${contact.id} customer`);
		if (contact.tenantId !== customer.tenantId) throw new Error(`Contact ${contact.id} tenant mismatch`);
	}
	for (const opportunity of dataset.opportunities) {
		const customer = requireRecord(customerById, opportunity.customerId, `opportunity ${opportunity.id} customer`);
		assertTenantOwner(opportunity, customer.tenantId, userById);
	}
	for (const order of dataset.orders) {
		const customer = requireRecord(customerById, order.customerId, `order ${order.id} customer`);
		assertTenantOwner(order, customer.tenantId, userById);
		if (
			order.contactId &&
			requireRecord(contactById, order.contactId, `order ${order.id} contact`).customerId !== customer.id
		)
			throw new Error(`Order ${order.id} contact mismatch`);
		if (
			order.opportunityId &&
			requireRecord(opportunityById, order.opportunityId, `order ${order.id} opportunity`).customerId !== customer.id
		)
			throw new Error(`Order ${order.id} opportunity mismatch`);
	}
	for (const lead of dataset.leads) {
		assertTenantOwner(lead, lead.tenantId, userById);
		if (lead.status === 'converted') {
			const customer = requireRecord(customerById, lead.convertedCustomerId, `lead ${lead.id} customer`);
			const contact = requireRecord(contactById, lead.convertedContactId, `lead ${lead.id} contact`);
			const opportunity = requireRecord(opportunityById, lead.convertedOpportunityId, `lead ${lead.id} opportunity`);
			if (
				customer.id !== contact.customerId ||
				customer.id !== opportunity.customerId ||
				customer.tenantId !== lead.tenantId
			)
				throw new Error(`Lead ${lead.id} conversion relation mismatch`);
		}
	}
	for (const form of dataset.forms) assertTenantOwner(form, form.tenantId, userById);
	return dataset;
}

export const consoleDemoDataset = createConsoleDemoDataset();

function createMetaUsers(seed: number, count: number, tenantIds: readonly string[]): MetaUserRecord[] {
	const faker = createFaker(seed, 1);
	return Array.from({ length: count }, (_, index) => {
		const id = identifier('user', index);
		const primaryTenant = tenantIds[index % tenantIds.length] as string;
		const additional = faker.helpers.arrayElements(
			tenantIds.filter((tenantId) => tenantId !== primaryTenant),
			{ min: 0, max: Math.min(2, tenantIds.length - 1) },
		);
		return {
			id,
			name: index === 0 ? '林澄' : index === 1 ? '周屿' : index === 2 ? '陈安' : faker.person.fullName(),
			email: `${id}@example.com`,
			tenantIds: [primaryTenant, ...additional],
			roles:
				index === 0
					? ['owner', 'admin']
					: index === 2
						? ['auditor']
						: [faker.helpers.arrayElement(['admin', 'member', 'auditor'])],
			status: faker.helpers.weightedArrayElement([
				{ value: 'active', weight: 8 },
				{ value: 'invited', weight: 1 },
				{ value: 'disabled', weight: 1 },
			]),
			lastActiveAt: recentTimestamp(faker, 45),
			updatedAt: recentTimestamp(faker, 90),
		};
	});
}

function createTenants(seed: number, tenantIds: readonly string[], users: readonly MetaUserRecord[]): TenantRecord[] {
	const faker = createFaker(seed, 2);
	return tenantIds.map((id, index) => ({
		id,
		name: index === 0 ? '示例集团' : index === 1 ? '演示空间' : index === 2 ? '测试组织' : `示例租户 ${index + 1}`,
		plan: faker.helpers.arrayElement(['starter', 'growth', 'enterprise']),
		status: faker.helpers.weightedArrayElement([
			{ value: 'active', weight: 8 },
			{ value: 'trial', weight: 1 },
			{ value: 'suspended', weight: 1 },
		]),
		ownerUserId: (users.find((user) => user.tenantIds.includes(id)) ?? (users[0] as MetaUserRecord)).id,
		updatedAt: recentTimestamp(faker, 120),
	}));
}

function createAdminUsers(seed: number, count: number, users: readonly MetaUserRecord[]): AdminUserRecord[] {
	const faker = createFaker(seed, 3);
	return Array.from({ length: count }, (_, index) => {
		const user = users[index % users.length] as MetaUserRecord;
		return {
			id: identifier('admin-user', index),
			userId: user.id,
			tenantId: user.tenantIds[0] as string,
			role: faker.helpers.arrayElement(['owner', 'admin', 'operator', 'auditor']),
			updatedAt: recentTimestamp(faker, 60),
		};
	});
}

function createCustomers(
	seed: number,
	count: number,
	tenantIds: readonly string[],
	usersByTenant: Map<string, MetaUserRecord[]>,
): CustomerRecord[] {
	const faker = createFaker(seed, 4);
	const anchors: CustomerRecord[] = [
		customerAnchor('customer-qiming', '启明科技', '林澄', 'active', tenantIds[0] as string, usersByTenant),
		customerAnchor('customer-yuanshan', '远山制造', '周屿', 'prospect', tenantIds[1] as string, usersByTenant),
		customerAnchor('customer-hailan', '海岚零售', '陈安', 'inactive', tenantIds[2] as string, usersByTenant),
	];
	const industries = ['软件与信息服务', '智能制造', '零售', '金融服务', '物流', '专业服务'];
	return appendGenerated(anchors, count, (index) => {
		const tenantId = faker.helpers.arrayElement(tenantIds);
		const owner = faker.helpers.arrayElement(usersByTenant.get(tenantId) as MetaUserRecord[]);
		return {
			id: identifier('customer', index),
			tenantId,
			ownerUserId: owner.id,
			name: `示例 ${String(index + 1).padStart(3, '0')} · ${faker.company.name()}`,
			owner: owner.name,
			industry: faker.helpers.arrayElement(industries),
			status: faker.helpers.weightedArrayElement([
				{ value: 'active', weight: 7 },
				{ value: 'prospect', weight: 2 },
				{ value: 'inactive', weight: 1 },
			]),
			updatedAt: recentTimestamp(faker, 90),
		};
	});
}

function createContacts(seed: number, count: number, customers: readonly CustomerRecord[]): ContactRecord[] {
	const faker = createFaker(seed, 5);
	const anchors: ContactRecord[] = [
		contactAnchor('contact-lincheng', customers[0] as CustomerRecord, '林澄', '采购负责人', '13800000001'),
		contactAnchor('contact-zhouyu', customers[1] as CustomerRecord, '周屿', '技术总监', '13800000002'),
		contactAnchor('contact-chenan', customers[2] as CustomerRecord, '陈安', '门店运营', '13800000003'),
	];
	const roles = ['总经理', '采购负责人', '技术总监', '财务负责人', '运营经理', '项目经理'];
	return appendGenerated(anchors, count, (index) => {
		const customer = customers[index % customers.length] as CustomerRecord;
		const recordId = identifier('contact', index);
		return {
			id: recordId,
			tenantId: customer.tenantId,
			customerId: customer.id,
			name: faker.person.fullName(),
			role: faker.helpers.arrayElement(roles),
			email: `${recordId}@example.com`,
			phone: `1${faker.string.numeric({ length: 10, allowLeadingZeros: true })}`,
			updatedAt: recentTimestamp(faker, 60),
		};
	});
}

function createOpportunities(
	seed: number,
	count: number,
	customers: readonly CustomerRecord[],
	usersByTenant: Map<string, MetaUserRecord[]>,
): OpportunityRecord[] {
	const faker = createFaker(seed, 6);
	const topics = ['年度服务续约', '门店系统升级', '数据平台扩容', '客户运营项目', '安全能力建设'];
	return Array.from({ length: count }, (_, index) => {
		const customer = customers[index % customers.length] as CustomerRecord;
		return {
			id: identifier('opportunity', index),
			tenantId: customer.tenantId,
			customerId: customer.id,
			ownerUserId: faker.helpers.arrayElement(usersByTenant.get(customer.tenantId) as MetaUserRecord[]).id,
			name: index === 0 ? '年度云服务续约' : faker.helpers.arrayElement(topics),
			stage: faker.helpers.arrayElement(['qualification', 'proposal', 'negotiation', 'won', 'lost']),
			amount: money(faker, 50_000, 2_000_000),
			updatedAt: recentTimestamp(faker, 90),
		};
	});
}

function createOrders(
	seed: number,
	count: number,
	customers: readonly CustomerRecord[],
	contacts: readonly ContactRecord[],
	opportunities: readonly OpportunityRecord[],
	usersByTenant: Map<string, MetaUserRecord[]>,
): OrderRecord[] {
	const faker = createFaker(seed, 7);
	return Array.from({ length: count }, (_, index) => {
		const customer = customers[index % customers.length] as CustomerRecord;
		const contact = contacts.find((record) => record.customerId === customer.id);
		const opportunity = opportunities.find((record) => record.customerId === customer.id);
		return {
			id: identifier('order', index),
			tenantId: customer.tenantId,
			customerId: customer.id,
			contactId: contact?.id,
			opportunityId: opportunity?.id,
			ownerUserId: faker.helpers.arrayElement(usersByTenant.get(customer.tenantId) as MetaUserRecord[]).id,
			name: index === 0 ? 'ORD-2026-0188' : `ORD-2026-${String(index + 1).padStart(4, '0')}`,
			status: faker.helpers.arrayElement(['draft', 'confirmed', 'delivering', 'completed', 'cancelled']),
			amount: money(faker, 10_000, 800_000),
			updatedAt: recentTimestamp(faker, 90),
		};
	});
}

function createLeads(
	seed: number,
	count: number,
	tenantIds: readonly string[],
	usersByTenant: Map<string, MetaUserRecord[]>,
	customers: readonly CustomerRecord[],
	contacts: readonly ContactRecord[],
	opportunities: readonly OpportunityRecord[],
): LeadRecord[] {
	const faker = createFaker(seed, 8);
	return Array.from({ length: count }, (_, index) => {
		const converted = index % 5 === 0;
		const opportunity = converted ? (opportunities[index % opportunities.length] as OpportunityRecord) : undefined;
		const customer = opportunity ? customers.find((record) => record.id === opportunity.customerId) : undefined;
		const contact = customer ? contacts.find((record) => record.customerId === customer.id) : undefined;
		const tenantId = customer?.tenantId ?? faker.helpers.arrayElement(tenantIds);
		const common = {
			id: identifier('lead', index),
			tenantId,
			ownerUserId: faker.helpers.arrayElement(usersByTenant.get(tenantId) as MetaUserRecord[]).id,
			name: faker.person.fullName(),
			company: `潜在线索 · ${faker.company.name()}`,
			source: faker.helpers.arrayElement(['website', 'event', 'partner', 'referral', 'outbound']),
			score: faker.number.int({ min: 10, max: 100 }),
			updatedAt: recentTimestamp(faker, 45),
		};
		if (!converted)
			return {
				...common,
				status: faker.helpers.arrayElement(['new', 'working', 'qualified', 'disqualified']),
			};
		if (!opportunity || !customer || !contact) throw new Error(`Cannot build converted lead ${common.id}`);
		return {
			...common,
			status: 'converted',
			convertedCustomerId: customer.id,
			convertedContactId: contact.id,
			convertedOpportunityId: opportunity.id,
		};
	});
}

function createForms(
	seed: number,
	count: number,
	tenantIds: readonly string[],
	usersByTenant: Map<string, MetaUserRecord[]>,
): FormRecord[] {
	const faker = createFaker(seed, 9);
	const names = ['客户拜访记录', '销售线索登记', '项目交付验收', '售后服务反馈', '商机评审表'];
	return Array.from({ length: count }, (_, index) => {
		const tenantId = tenantIds[index % tenantIds.length] as string;
		return {
			id: identifier('form', index),
			tenantId,
			ownerUserId: faker.helpers.arrayElement(usersByTenant.get(tenantId) as MetaUserRecord[]).id,
			name: index < names.length ? (names[index] as string) : `${faker.helpers.arrayElement(names)} ${index + 1}`,
			status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
			submissionCount: faker.number.int({ min: 0, max: 2500 }),
			updatedAt: recentTimestamp(faker, 120),
		};
	});
}

function createFaker(seed: number, scope: number) {
	const faker = new Faker({ locale: [zh_CN, en] });
	faker.seed([seed, scope]);
	faker.setDefaultRefDate(CONSOLE_DEMO_REFERENCE_DATE);
	return faker;
}

function identifier(kind: string, index: number) {
	return `${kind}-${String(index + 1).padStart(4, '0')}`;
}

function recentTimestamp(faker: Faker, days: number) {
	const to = new Date(CONSOLE_DEMO_REFERENCE_DATE);
	const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
	return faker.date.between({ from, to }).toISOString();
}

function money(faker: Faker, min: number, max: number) {
	return faker.number.int({ min: min * 100, max: max * 100 }) / 100;
}

function appendGenerated<T>(anchors: readonly T[], count: number, create: (index: number) => T): T[] {
	return [
		...anchors.slice(0, count),
		...Array.from({ length: Math.max(0, count - anchors.length) }, (_, index) => create(index + anchors.length)),
	];
}

function customerAnchor(
	id: string,
	name: string,
	ownerName: string,
	status: CustomerRecord['status'],
	tenantId: string,
	usersByTenant: Map<string, MetaUserRecord[]>,
): CustomerRecord {
	const owner =
		usersByTenant.get(tenantId)?.find((user) => user.name === ownerName) ?? usersByTenant.get(tenantId)?.[0];
	if (!owner) throw new Error(`Missing owner for ${id}`);
	return {
		id,
		tenantId,
		ownerUserId: owner.id,
		name,
		owner: ownerName,
		industry: name === '海岚零售' ? '零售' : name === '远山制造' ? '智能制造' : '软件与信息服务',
		status,
		updatedAt: CONSOLE_DEMO_REFERENCE_DATE,
	};
}

function contactAnchor(id: string, customer: CustomerRecord, name: string, role: string, phone: string): ContactRecord {
	return {
		id,
		tenantId: customer.tenantId,
		customerId: customer.id,
		name,
		role,
		email: `${name === '林澄' ? 'lin' : name === '周屿' ? 'zhou' : 'chen'}@example.com`,
		phone,
		updatedAt: CONSOLE_DEMO_REFERENCE_DATE,
	};
}

function groupUsersByTenant(users: readonly MetaUserRecord[]) {
	const map = new Map<string, MetaUserRecord[]>();
	for (const user of users) {
		for (const tenantId of user.tenantIds) map.set(tenantId, [...(map.get(tenantId) ?? []), user]);
	}
	return map;
}

function assertUnique(records: readonly { id: string }[], kind: string) {
	if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error(`Duplicate ${kind} ID`);
}

function indexById<T extends { id: string }>(records: readonly T[]) {
	return new Map(records.map((record) => [record.id, record]));
}

function requireRecord<T>(map: Map<string, T>, id: string, relation: string): T {
	const record = map.get(id);
	if (!record) throw new Error(`Missing ${relation}: ${id}`);
	return record;
}

function assertTenantOwner(
	record: { id: string; tenantId: string; ownerUserId: string },
	expectedTenantId: string,
	users: Map<string, MetaUserRecord>,
) {
	if (record.tenantId !== expectedTenantId) throw new Error(`${record.id} tenant mismatch`);
	const owner = requireRecord(users, record.ownerUserId, `${record.id} owner`);
	if (!owner.tenantIds.includes(record.tenantId)) throw new Error(`${record.id} owner tenant mismatch`);
}
