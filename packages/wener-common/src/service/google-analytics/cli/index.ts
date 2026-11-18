import type { z } from 'zod';
import type { CliTable } from '../../../cli/render/CliTable';
import { type ServiceCliDefinition, type ServiceCliOptions, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IGoogleAnalyticsService } from '../IGoogleAnalyticsService';
import {
	GoogleAnalyticsAccountSummariesInputSchema,
	GoogleAnalyticsPropertyInputSchema,
	GoogleAnalyticsRealtimeReportInputSchema,
	GoogleAnalyticsReportInputSchema,
} from '../GoogleAnalyticsServiceContract';

const MaxRows = 250_000;
export const GoogleAnalyticsDefaultDateFrom = '28daysAgo';
export const GoogleAnalyticsDefaultDateTo = 'yesterday';

const propertyOption = { name: 'property', description: 'GA4 property ID or properties/<id> (required)' } as const;
const dimensionOption = { name: 'dimension', description: 'Dimension API name; repeatable', repeatable: true } as const;
const metricOption = { name: 'metric', description: 'Metric API name; repeatable', repeatable: true } as const;
const limitOption = { name: 'limit', description: `Maximum rows (1-${MaxRows})` } as const;

/**
 * Google Analytics commands. Browser-safe: no Commander or Node builtins; hosts mount it through
 * a service CLI binding and resolve credentials only after `prepare` succeeds.
 */
export const GoogleAnalyticsCliDefinition = {
	name: 'google-analytics',
	aliases: ['ga'],
	description: 'Query Google Analytics (GA4) accounts, metadata and reports',
	commands: [
		{
			name: 'status',
			aliases: ['accounts'],
			description: 'List accessible accounts and properties',
			options: [
				{ name: 'page-size', description: 'Accounts per page (1-200)' },
				{ name: 'page-token', description: 'Page token from a previous response' },
			],
			table: googleAnalyticsAccountTable,
			prepare({ options }) {
				const input = parseInput(GoogleAnalyticsAccountSummariesInputSchema, {
					pageSize: optionalInteger(options, 'page-size', 1, 200),
					pageToken: serviceCliString(options, 'page-token')?.trim() || undefined,
				});
				return async (service, { signal }) => service.listAccountSummaries(input, { signal });
			},
		},
		{
			group: 'report',
			name: 'run',
			description: 'Run a GA4 report',
			table: googleAnalyticsReportTable,
			options: [
				propertyOption,
				{ name: 'date-from', description: `Start date, e.g. ${GoogleAnalyticsDefaultDateFrom} or 2026-01-01` },
				{ name: 'date-to', description: `End date, e.g. ${GoogleAnalyticsDefaultDateTo} or 2026-01-31` },
				dimensionOption,
				metricOption,
				limitOption,
				{ name: 'offset', description: 'Rows to skip' },
			],
			prepare({ options }) {
				const input = parseInput(GoogleAnalyticsReportInputSchema, {
					propertyId: requiredString(options, 'property'),
					dateRanges: [
						{
							startDate: serviceCliString(options, 'date-from')?.trim() || GoogleAnalyticsDefaultDateFrom,
							endDate: serviceCliString(options, 'date-to')?.trim() || GoogleAnalyticsDefaultDateTo,
						},
					],
					dimensions: requiredStrings(options, 'dimension'),
					metrics: requiredStrings(options, 'metric'),
					limit: optionalInteger(options, 'limit', 1, MaxRows),
					offset: optionalInteger(options, 'offset', 0, Number.MAX_SAFE_INTEGER),
				});
				return async (service, { signal }) => service.runReport(input, { signal });
			},
		},
		{
			group: 'report',
			name: 'realtime',
			description: 'Run a GA4 realtime report',
			table: googleAnalyticsReportTable,
			options: [propertyOption, dimensionOption, metricOption, limitOption],
			prepare({ options }) {
				const input = parseInput(GoogleAnalyticsRealtimeReportInputSchema, {
					propertyId: requiredString(options, 'property'),
					dimensions: requiredStrings(options, 'dimension'),
					metrics: requiredStrings(options, 'metric'),
					limit: optionalInteger(options, 'limit', 1, MaxRows),
				});
				return async (service, { signal }) => service.runRealtimeReport(input, { signal });
			},
		},
		{
			group: 'metadata',
			name: 'property',
			description: 'Get property details',
			table: googleAnalyticsPropertyTable,
			options: [propertyOption],
			prepare({ options }) {
				const input = parseInput(GoogleAnalyticsPropertyInputSchema, { propertyId: requiredString(options, 'property') });
				return async (service, { signal }) => service.getProperty(input, { signal });
			},
		},
		{
			group: 'metadata',
			name: 'list',
			aliases: ['get'],
			description: 'List dimensions and metrics available to a property',
			table: googleAnalyticsMetadataTable,
			options: [propertyOption],
			prepare({ options }) {
				const input = parseInput(GoogleAnalyticsPropertyInputSchema, { propertyId: requiredString(options, 'property') });
				return async (service, { signal }) => service.getMetadata(input, { signal });
			},
		},
	],
} satisfies ServiceCliDefinition<IGoogleAnalyticsService>;

function requiredString(options: ServiceCliOptions, name: string): string {
	const value = serviceCliString(options, name)?.trim();
	if (!value) throw new ServiceCliInputError(`--${name} is required`);
	return value;
}

function requiredStrings(options: ServiceCliOptions, name: string): string[] {
	const values = serviceCliStrings(options, name)?.map((value) => value.trim()).filter(Boolean);
	if (!values?.length) throw new ServiceCliInputError(`--${name} is required at least once`);
	return values;
}

function optionalInteger(options: ServiceCliOptions, name: string, minimum: number, maximum: number): number | undefined {
	const value = serviceCliString(options, name);
	if (value === undefined) return undefined;
	const parsed = Number(value);
	if (!value.trim() || !Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum)
		throw new ServiceCliInputError(`--${name} must be between ${minimum} and ${maximum}`);
	return parsed;
}

/** Validate before resolving the service; messages contain only the field path and a fixed reason. */
function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
	const result = schema.safeParse(value);
	if (result.success) return result.data;
	const issue = result.error.issues[0];
	throw new ServiceCliInputError(`Invalid ${issue?.path.join('.') || 'input'}: ${issue?.message ?? 'invalid value'}`);
}

type JsonRecord = Record<string, unknown>;

/** `status`: one row per accessible property. */
export function googleAnalyticsAccountTable(value: unknown): CliTable {
	const rows: unknown[][] = [];
	for (const account of records(field(value, 'accountSummaries'))) {
		const properties = records(account.propertySummaries);
		if (!properties.length) rows.push([text(account.displayName), text(account.account), '-', '-']);
		for (const property of properties)
			rows.push([text(account.displayName), text(account.account), text(property.displayName), text(property.property)]);
	}
	const next = field(value, 'nextPageToken');
	return {
		headers: ['ACCOUNT', 'ACCOUNT ID', 'PROPERTY', 'PROPERTY ID'],
		rows,
		columnOptions: [{}, { truncate: false }, {}, { truncate: false }],
		emptyMessage: 'No accessible Google Analytics accounts.',
		countLabel: 'properties',
		footer: typeof next === 'string' && next ? 'More accounts available; use --page-token from JSON output' : undefined,
	};
}

/** `report run|realtime`: dimension columns first, then metrics, matching GA header order. */
export function googleAnalyticsReportTable(value: unknown): CliTable {
	const dimensions = records(field(value, 'dimensionHeaders')).map((header) => text(header.name));
	const metrics = records(field(value, 'metricHeaders')).map((header) => text(header.name));
	const rows = records(field(value, 'rows')).map((row) => [...cells(row.dimensionValues, dimensions.length), ...cells(row.metricValues, metrics.length)]);
	const rowCount = field(value, 'rowCount');
	return {
		headers: [...dimensions, ...metrics],
		rows,
		columnOptions: [...dimensions.map(() => ({})), ...metrics.map(() => ({ align: 'right' as const }))],
		emptyMessage: 'No rows.',
		countLabel: 'rows',
		footer: typeof rowCount === 'number' && rowCount !== rows.length ? `${rows.length} of ${rowCount} rows` : undefined,
	};
}

/** `metadata property`: field/value detail. */
export function googleAnalyticsPropertyTable(value: unknown): CliTable {
	const property = isRecord(value) ? value : {};
	return {
		kind: 'detail',
		headers: ['FIELD', 'VALUE'],
		rows: ['name', 'displayName', 'propertyType', 'parent', 'timeZone', 'currencyCode', 'industryCategory', 'createTime'].map((key) => [key, property[key]]),
	};
}

/** `metadata list`: dimensions and metrics in one table. */
export function googleAnalyticsMetadataTable(value: unknown): CliTable {
	const row = (kind: string) => (item: JsonRecord) => [kind, text(item.apiName), text(item.uiName), text(item.category)];
	return {
		headers: ['KIND', 'API NAME', 'UI NAME', 'CATEGORY'],
		rows: [...records(field(value, 'dimensions')).map(row('dimension')), ...records(field(value, 'metrics')).map(row('metric'))],
		columnOptions: [{}, { truncate: false }, {}, {}],
		emptyMessage: 'No metadata.',
		countLabel: 'fields',
	};
}

function field(value: unknown, key: string): unknown {
	return isRecord(value) ? value[key] : undefined;
}
function records(value: unknown): JsonRecord[] {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}
function cells(value: unknown, count: number): string[] {
	const items = records(value).map((item) => text(item.value));
	return Array.from({ length: count }, (_, index) => items[index] ?? '');
}
function text(value: unknown): string {
	return value === undefined || value === null ? '' : String(value);
}
function isRecord(value: unknown): value is JsonRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
