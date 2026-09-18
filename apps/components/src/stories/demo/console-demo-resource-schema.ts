import { z } from 'zod';

const id = (kind: string) => z.string().regex(new RegExp(`^${kind}-[a-z0-9-]+$`));
const timestamp = z.iso.datetime({ offset: true });

export const TenantRecordSchema = z.strictObject({
	id: id('tenant'),
	name: z.string().min(2).max(80),
	plan: z.enum(['starter', 'growth', 'enterprise']),
	status: z.enum(['active', 'trial', 'suspended']),
	ownerUserId: id('user'),
	updatedAt: timestamp,
});

export const MetaUserRecordSchema = z.strictObject({
	id: id('user'),
	name: z.string().min(2).max(80),
	email: z.email(),
	tenantIds: z.array(id('tenant')).min(1).max(3),
	roles: z
		.array(z.enum(['owner', 'admin', 'member', 'auditor']))
		.min(1)
		.max(3),
	status: z.enum(['active', 'invited', 'disabled']),
	lastActiveAt: timestamp,
	updatedAt: timestamp,
});

export const AdminUserRecordSchema = z.strictObject({
	id: id('admin-user'),
	userId: id('user'),
	tenantId: id('tenant'),
	role: z.enum(['owner', 'admin', 'operator', 'auditor']),
	updatedAt: timestamp,
});

export const CustomerRecordSchema = z.strictObject({
	id: id('customer'),
	tenantId: id('tenant'),
	ownerUserId: id('user'),
	name: z.string().min(1).max(120),
	owner: z.string().min(1).max(80),
	industry: z.string().min(1).max(80),
	status: z.enum(['active', 'prospect', 'inactive']),
	updatedAt: timestamp,
});

export const ContactRecordSchema = z.strictObject({
	id: id('contact'),
	tenantId: id('tenant'),
	customerId: id('customer'),
	name: z.string().min(1).max(80),
	role: z.string().min(1).max(80),
	email: z.email(),
	phone: z.string().min(1).max(32),
	updatedAt: timestamp,
});

export const OpportunityRecordSchema = z.strictObject({
	id: id('opportunity'),
	tenantId: id('tenant'),
	customerId: id('customer'),
	ownerUserId: id('user'),
	name: z.string().min(2).max(120),
	stage: z.enum(['qualification', 'proposal', 'negotiation', 'won', 'lost']),
	amount: z.number().nonnegative().multipleOf(0.01),
	updatedAt: timestamp,
});

export const OrderRecordSchema = z.strictObject({
	id: id('order'),
	tenantId: id('tenant'),
	customerId: id('customer'),
	contactId: id('contact').optional(),
	opportunityId: id('opportunity').optional(),
	ownerUserId: id('user'),
	name: z.string().regex(/^ORD-\d{4}-\d{4}$/),
	status: z.enum(['draft', 'confirmed', 'delivering', 'completed', 'cancelled']),
	amount: z.number().nonnegative().multipleOf(0.01),
	updatedAt: timestamp,
});

const leadRecordBaseShape = {
	id: id('lead'),
	tenantId: id('tenant'),
	ownerUserId: id('user'),
	name: z.string().min(2).max(80),
	company: z.string().min(2).max(120),
	source: z.enum(['website', 'event', 'partner', 'referral', 'outbound']),
	score: z.number().int().min(0).max(100),
	updatedAt: timestamp,
} as const;

export const LeadRecordSchema = z.discriminatedUnion('status', [
	z.strictObject({
		...leadRecordBaseShape,
		status: z.literal('converted'),
		convertedCustomerId: id('customer'),
		convertedContactId: id('contact'),
		convertedOpportunityId: id('opportunity'),
	}),
	z.strictObject({
		...leadRecordBaseShape,
		status: z.enum(['new', 'working', 'qualified', 'disqualified']),
	}),
]);

export const FormRecordSchema = z.strictObject({
	id: id('form'),
	tenantId: id('tenant'),
	ownerUserId: id('user'),
	name: z.string().min(2).max(120),
	status: z.enum(['draft', 'published', 'archived']),
	submissionCount: z.number().int().nonnegative(),
	updatedAt: timestamp,
});

export const consoleDemoResourceSchemas = {
	tenant: TenantRecordSchema,
	metaUser: MetaUserRecordSchema,
	adminUser: AdminUserRecordSchema,
	customer: CustomerRecordSchema,
	contact: ContactRecordSchema,
	opportunity: OpportunityRecordSchema,
	order: OrderRecordSchema,
	lead: LeadRecordSchema,
	form: FormRecordSchema,
} as const;

export type ConsoleDemoResourceKind = keyof typeof consoleDemoResourceSchemas;
export type TenantRecord = z.infer<typeof TenantRecordSchema>;
export type MetaUserRecord = z.infer<typeof MetaUserRecordSchema>;
export type AdminUserRecord = z.infer<typeof AdminUserRecordSchema>;
export type CustomerRecord = z.infer<typeof CustomerRecordSchema>;
export type ContactRecord = z.infer<typeof ContactRecordSchema>;
export type OpportunityRecord = z.infer<typeof OpportunityRecordSchema>;
export type OrderRecord = z.infer<typeof OrderRecordSchema>;
export type LeadRecord = z.infer<typeof LeadRecordSchema>;
export type FormRecord = z.infer<typeof FormRecordSchema>;
export type CustomerStatus = CustomerRecord['status'];

export const consoleDemoResourceJsonSchemas = Object.fromEntries(
	Object.entries(consoleDemoResourceSchemas).map(([kind, schema]) => [
		kind,
		{
			...z.toJSONSchema(schema, { target: 'draft-2020-12' }),
			$id: `https://example.com/schema/console-demo/${kind}.json`,
			title: `${kind} mock resource`,
		},
	]),
) as unknown as Record<ConsoleDemoResourceKind, Record<string, unknown>>;
