import { z } from 'zod/v4';
import type { EnumValues } from './types';

export const ResourceType = Object.freeze({
	__proto__: null,
	User: 'User',
	Customer: 'Customer',
	Contact: 'Contact',
	Account: 'Account',
	Order: 'Order',
	Lead: 'Lead',
	Opportunity: 'Opportunity',
} as const);
export type ResourceType = EnumValues<typeof ResourceType>;
export const ResourceTypeSchema = z
	.union([
		z.literal(ResourceType.User).describe('用户'),
		z.literal(ResourceType.Customer).describe('客户'),
		z.literal(ResourceType.Contact).describe('联系人'),
		z.literal(ResourceType.Account).describe('账户'),
		z.literal(ResourceType.Order).describe('订单'),
		z.literal(ResourceType.Lead).describe('线索'),
		z.literal(ResourceType.Opportunity).describe('商机'),
	])
	.meta({ title: 'ResourceType', description: '资源类型', type: 'string' });
