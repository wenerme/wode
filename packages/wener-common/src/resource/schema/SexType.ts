import { z } from 'zod/v4';
import type { EnumValues } from './types';

export const SexType = Object.freeze({
	__proto__: null,
	Male: 'Male',
	Female: 'Female',
	// Intersex
} as const);
export type SexType = EnumValues<typeof SexType>;
export const SexTypeSchema = z
	.union([z.literal(SexType.Male).describe('男'), z.literal(SexType.Female).describe('女')])
	.describe('性别');
