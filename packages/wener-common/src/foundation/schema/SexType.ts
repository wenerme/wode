import { z } from 'zod/v4';
import type { EnumValues } from '../../resource/schema';

// Sex 指的是生理性别/生物性别，通常由出生时的生物特征决定
export const SexType = Object.freeze({
	__proto__: null,
	Male: 'Male',
	Female: 'Female',
});
export type SexType = EnumValues<typeof SexType>;

export const SexTypeSchema = z
	.union([
		//
		z
			.literal(SexType.Male)
			.describe('男'),
		z.literal(SexType.Female).describe('女'),
	])
	.describe('性别')
	.meta({
		title: 'SexType',
	});
