import z from 'zod/v4';
import type { EnumValues } from '../resource/schema';

export const DivisionLevel = Object.freeze({
	__proto__: null,
	Province: 'Province',
	City: 'City',
	County: 'County',
	Town: 'Town',
	Village: 'Village',
});
const DivisionLevels = [
	DivisionLevel.Province,
	DivisionLevel.City,
	DivisionLevel.County,
	DivisionLevel.Town, // 3
	DivisionLevel.Village, // 3
];
export type DivisionLevel = EnumValues<typeof DivisionLevel>;
export const DivisionLevelSchema = z
	.union([
		z.literal(DivisionLevel.Province).describe('省级').meta({ ordinal: 1 }),
		z.literal(DivisionLevel.City).describe('地级').meta({ ordinal: 2 }),
		z.literal(DivisionLevel.County).describe('县级').meta({ ordinal: 3 }),
		z.literal(DivisionLevel.Town).describe('乡镇级').meta({ ordinal: 4 }),
		z.literal(DivisionLevel.Village).describe('村级').meta({ ordinal: 5 }),
	])
	.describe('行政区划级别');

export type ParsedDivisionCode = z.infer<typeof ParsedDivisionCodeSchema>;
export const ParsedDivisionCodeSchema = z.object({
	code: z.string().describe('行政区划代码'),
	name: z.string().describe('行政区划名称'),
	level: DivisionLevelSchema,
	codes: z.string().array(),
	names: z.string().array(),
	latitude: z.number().optional().describe('纬度'),
	longitude: z.number().optional().describe('经度'),
});

interface CodeName {
	value: string;
	name: string;
	children?: Array<CodeName>;
}

export const DivisionCodeRegex =
	/^(?<province>\d{2})(?<city>\d{2})?(?<county>\d{2})?(?<town>\d{3})?(?<village>\d{3})?$/;

const CodeNames: CodeName[] = [
	{ value: '11', name: '北京市' },
	{ value: '12', name: '天津市' },
	{ value: '13', name: '河北省' },
	{ value: '14', name: '山西省' },
	{ value: '15', name: '内蒙古自治区' },
	{ value: '21', name: '辽宁省' },
	{ value: '22', name: '吉林省' },
	{ value: '23', name: '黑龙江省' },
	{ value: '31', name: '上海市' },
	{ value: '32', name: '江苏省' },
	{ value: '33', name: '浙江省' },
	{ value: '34', name: '安徽省' },
	{ value: '35', name: '福建省' },
	{ value: '36', name: '江西省' },
	{ value: '37', name: '山东省' },
	{ value: '41', name: '河南省' },
	{ value: '42', name: '湖北省' },
	{ value: '43', name: '湖南省' },
	{ value: '44', name: '广东省' },
	{ value: '45', name: '广西壮族自治区' },
	{ value: '46', name: '海南省' },
	{ value: '50', name: '重庆市' },
	{ value: '51', name: '四川省' },
	{ value: '52', name: '贵州省' },
	{ value: '53', name: '云南省' },
	{ value: '54', name: '西藏自治区' },
	{ value: '61', name: '陕西省' },
	{ value: '62', name: '甘肃省' },
	{ value: '63', name: '青海省' },
	{ value: '64', name: '宁夏回族自治区' },
	{ value: '65', name: '新疆维吾尔自治区' },
	{ value: '71', name: '台湾省' },
	{ value: '81', name: '香港特别行政区' },
	{ value: '82', name: '澳门特别行政区' },
	// 9 国外
];

export function parseDivisionCode(code: string): ParsedDivisionCode | undefined {
	const match = DivisionCodeRegex.exec(code);
	if (!match) {
		return undefined;
	}
	const { province, city, county, town, village } = match.groups ?? {};
	if (!province) {
		return undefined;
	}

	const codes = [province, city, county, town, village].filter(Boolean);
	const names: string[] = [];
	{
		let name = CodeNames.find((cn) => cn.value === province);
		if (name) {
			names.push(name.name);
		}
	}
	let level: DivisionLevel = DivisionLevels[codes.length - 1];
	return {
		code,
		name: names.join(''),
		level,
		codes,
		names,
	};
}

export function formatDivisionCode({
	province,
	city,
	county,
	town,
	village,
	codes = [],
}: {
	province?: string | number;
	city?: string | number;
	county?: string | number;
	town?: string | number;
	village?: string | number;
	codes?: string[];
}): string {
	if (!codes.length) {
		for (let i = 0; i < [province, city, county, town, village].length; i++) {
			let x = [province, city, county, town, village][i];
			if (x === undefined || x === null || x === '') {
				break;
			}
			let size = 2;
			if (i > 2) {
				size = 3;
			}
			codes.push(String(x).padStart(size, '0').slice(0, size));
		}
	}

	return codes.join('');
}

export namespace DivisionCode {
	export const regex = DivisionCodeRegex;
	export const parse = parseDivisionCode;
	export const format = formatDivisionCode;
	export type Result = ParsedDivisionCode;
	export const ResultSchema = ParsedDivisionCodeSchema;
}
