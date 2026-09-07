import { describe, expect, it } from 'vite-plus/test';
import { CONSOLE_DEMO_COUNTS, createConsoleDemoDataset, validateConsoleDemoDataset } from './console-demo-dataset';
import { dataListPages } from './console-demo-navigation';
import { getConsoleDemoResourcePageData } from './console-demo-resource-presenter';
import { consoleDemoResourceJsonSchemas, consoleDemoResourceSchemas } from './console-demo-resource-schema';

describe('console demo generated dataset', () => {
	it('is deterministic per seed and independent across seeds', () => {
		const first = createConsoleDemoDataset({ seed: 42 });
		expect(createConsoleDemoDataset({ seed: 42 })).toEqual(first);
		expect(createConsoleDemoDataset({ seed: 43 })).not.toEqual(first);
	});

	it('matches the advertised resource counts and keeps stable acceptance anchors', () => {
		const dataset = createConsoleDemoDataset();
		expect(dataset.customers).toHaveLength(CONSOLE_DEMO_COUNTS.customers);
		expect(dataset.contacts).toHaveLength(CONSOLE_DEMO_COUNTS.contacts);
		expect(dataset.orders).toHaveLength(CONSOLE_DEMO_COUNTS.orders);
		expect(dataset.opportunities).toHaveLength(CONSOLE_DEMO_COUNTS.opportunities);
		expect(dataset.leads).toHaveLength(CONSOLE_DEMO_COUNTS.leads);
		expect(dataset.forms).toHaveLength(CONSOLE_DEMO_COUNTS.forms);
		expect(dataset.adminUsers).toHaveLength(CONSOLE_DEMO_COUNTS.adminUsers);
		expect(dataset.tenants).toHaveLength(CONSOLE_DEMO_COUNTS.tenants);
		expect(dataset.metaUsers).toHaveLength(CONSOLE_DEMO_COUNTS.metaUsers);
		expect(dataset.customers.some((record) => record.name === '启明科技')).toBe(true);
		expect(dataset.contacts.some((record) => record.email === 'lin@example.com')).toBe(true);
		expect(dataset.orders.some((record) => record.name === 'ORD-2026-0188')).toBe(true);
	});

	it('validates every collection and exports strict Draft 2020-12 JSON Schemas', () => {
		const dataset = createConsoleDemoDataset();
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
		for (const kind of Object.keys(consoleDemoResourceSchemas) as Array<keyof typeof consoleDemoResourceSchemas>) {
			expect(consoleDemoResourceSchemas[kind].array().safeParse(collections[kind]).success).toBe(true);
			expect(consoleDemoResourceSchemas[kind].safeParse({ id: 'invalid' }).success).toBe(false);
			const jsonSchema = consoleDemoResourceJsonSchemas[kind];
			expect(jsonSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
			if (kind === 'lead') {
				expect(jsonSchema.oneOf).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ additionalProperties: false, type: 'object' }),
						expect.objectContaining({ additionalProperties: false, type: 'object' }),
					]),
				);
			} else {
				expect(jsonSchema).toMatchObject({ additionalProperties: false, type: 'object' });
			}
		}
	});

	it('fails closed when a generated foreign key no longer resolves', () => {
		const dataset = createConsoleDemoDataset();
		dataset.contacts[0] = {
			...(dataset.contacts[0] as (typeof dataset.contacts)[number]),
			customerId: 'customer-missing',
		};
		expect(() => validateConsoleDemoDataset(dataset)).toThrow('Missing contact');
	});

	it('expresses lead conversion completeness in the resource schema', () => {
		const dataset = createConsoleDemoDataset();
		const converted = dataset.leads.find((record) => record.status === 'converted');
		const unconverted = dataset.leads.find((record) => record.status !== 'converted');
		expect(converted).toBeDefined();
		expect(unconverted).toBeDefined();
		const { convertedCustomerId: _customerId, ...incomplete } = converted as NonNullable<typeof converted>;
		expect(consoleDemoResourceSchemas.lead.safeParse(incomplete).success).toBe(false);
		expect(
			consoleDemoResourceSchemas.lead.safeParse({
				...unconverted,
				convertedCustomerId: dataset.customers[0]?.id,
			}).success,
		).toBe(false);
	});

	it('rejects cross-tenant owners and denormalized customer owner drift', () => {
		const ownerMismatch = createConsoleDemoDataset();
		const owner = ownerMismatch.metaUsers[0] as (typeof ownerMismatch.metaUsers)[number];
		const tenant = ownerMismatch.tenants.find((record) => !owner.tenantIds.includes(record.id));
		expect(tenant).toBeDefined();
		(tenant as (typeof ownerMismatch.tenants)[number]).ownerUserId = owner.id;
		expect(() => validateConsoleDemoDataset(ownerMismatch)).toThrow('owner membership mismatch');

		const nameMismatch = createConsoleDemoDataset();
		(nameMismatch.customers[0] as (typeof nameMismatch.customers)[number]).owner = '不一致负责人';
		expect(() => validateConsoleDemoDataset(nameMismatch)).toThrow('owner name mismatch');
	});

	it('projects every resource page with resolved relationship labels', () => {
		const dataset = createConsoleDemoDataset();
		for (const page of dataListPages) {
			const presentation = getConsoleDemoResourcePageData(page, dataset);
			expect(presentation.rows.length).toBeGreaterThan(0);
			expect(presentation.rows.every((row) => row.relation && !row.relation.includes('已删除'))).toBe(true);
		}
		const admin = dataset.adminUsers[0] as (typeof dataset.adminUsers)[number];
		const user = dataset.metaUsers.find((record) => record.id === admin.userId);
		const adminRow = getConsoleDemoResourcePageData('admin-user', dataset).rows[0];
		expect(adminRow).toMatchObject({ name: user?.name, owner: user?.email });
		expect(getConsoleDemoResourcePageData('meta-user', dataset).rows[0]?.owner).not.toMatch(
			/owner|admin|member|auditor/,
		);
	});
});
