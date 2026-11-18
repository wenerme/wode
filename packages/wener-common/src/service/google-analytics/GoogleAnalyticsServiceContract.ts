import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import type { GoogleAnalyticsRequestOptions } from '@wener/client/google-analytics';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const ga = oc.$meta<ServiceToolMeta>({});
/** Report endpoints are HTTP POST but query-only; every procedure is read-only. */
const readOnlyTool: ServiceToolMeta = { readOnlyHint: true, destructiveHint: false };

export const GoogleAnalyticsPropertyIdSchema = z
	.union([z.string(), z.number().int().positive()])
	.transform((value) => String(value).trim().replace(/^properties\//u, ''))
	.refine((value) => /^\d{1,32}$/u.test(value), 'propertyId must be a numeric GA4 property ID');

const name = z.string().trim().min(1).max(256);
const names = z.array(name).min(1).max(100);
const openRecord = z.record(z.string(), z.unknown());
const limit = z.number().int().min(1).max(250_000);

export const GoogleAnalyticsDateRangeSchema = z.strictObject({
	startDate: z.string().trim().min(1).max(64),
	endDate: z.string().trim().min(1).max(64),
	name: name.optional(),
});

export const GoogleAnalyticsAccountSummariesInputSchema = z
	.strictObject({
		pageSize: z.number().int().min(1).max(200).optional(),
		pageToken: z.string().min(1).max(4096).optional(),
	})
	.default({});

export const GoogleAnalyticsPropertyInputSchema = z.strictObject({ propertyId: GoogleAnalyticsPropertyIdSchema });

export const GoogleAnalyticsReportInputSchema = z.strictObject({
	propertyId: GoogleAnalyticsPropertyIdSchema,
	dateRanges: z.array(GoogleAnalyticsDateRangeSchema).min(1).max(4),
	dimensions: names,
	metrics: names,
	dimensionFilter: openRecord.optional(),
	metricFilter: openRecord.optional(),
	orderBys: z.array(openRecord).optional(),
	limit: limit.optional(),
	offset: z.number().int().min(0).optional(),
	currencyCode: z.string().trim().length(3).optional(),
	keepEmptyRows: z.boolean().optional(),
	returnPropertyQuota: z.boolean().optional(),
});

/** RunRealtimeReportRequest has no dateRanges/offset; strict object rejects them instead of dropping. */
export const GoogleAnalyticsRealtimeReportInputSchema = z.strictObject({
	propertyId: GoogleAnalyticsPropertyIdSchema,
	dimensions: names,
	metrics: names,
	dimensionFilter: openRecord.optional(),
	metricFilter: openRecord.optional(),
	orderBys: z.array(openRecord).optional(),
	limit: limit.optional(),
	returnPropertyQuota: z.boolean().optional(),
});

// Output: stable envelope fields are typed; supplier-defined parts stay open (looseObject / unknown).
const str = z.string().optional();

export const GoogleAnalyticsPropertySummarySchema = z.looseObject({
	property: str,
	displayName: str,
	propertyType: str,
	parent: str,
});
export const GoogleAnalyticsAccountSummarySchema = z.looseObject({
	name: str,
	account: str,
	displayName: str,
	propertySummaries: z.array(GoogleAnalyticsPropertySummarySchema).optional(),
});
export const GoogleAnalyticsAccountSummariesOutputSchema = z.looseObject({
	accountSummaries: z.array(GoogleAnalyticsAccountSummarySchema).optional(),
	nextPageToken: str,
});

export const GoogleAnalyticsPropertyOutputSchema = z.looseObject({
	name: str,
	displayName: str,
	propertyType: str,
	parent: str,
	timeZone: str,
	currencyCode: str,
	industryCategory: str,
	createTime: str,
	updateTime: str,
});

const metadataItem = z.looseObject({ apiName: str, uiName: str, description: str, category: str, customDefinition: z.boolean().optional() });
export const GoogleAnalyticsMetadataOutputSchema = z.looseObject({
	name: str,
	dimensions: z.array(metadataItem).optional(),
	metrics: z.array(metadataItem).optional(),
	comparisons: z.array(openRecord).optional(),
});

const header = z.looseObject({ name: str, type: str });
const cell = z.looseObject({ value: str });
const row = z.looseObject({ dimensionValues: z.array(cell).optional(), metricValues: z.array(cell).optional() });
export const GoogleAnalyticsReportOutputSchema = z.looseObject({
	dimensionHeaders: z.array(header).optional(),
	metricHeaders: z.array(header).optional(),
	rows: z.array(row).optional(),
	totals: z.array(row).optional(),
	maximums: z.array(row).optional(),
	minimums: z.array(row).optional(),
	rowCount: z.number().int().optional(),
	metadata: openRecord.optional(),
	propertyQuota: openRecord.optional(),
	kind: str,
});

export const GoogleAnalyticsServiceContract = {
	listAccountSummaries: ga.input(GoogleAnalyticsAccountSummariesInputSchema).output(GoogleAnalyticsAccountSummariesOutputSchema).meta(readOnlyTool),
	getProperty: ga.input(GoogleAnalyticsPropertyInputSchema).output(GoogleAnalyticsPropertyOutputSchema).meta(readOnlyTool),
	getMetadata: ga.input(GoogleAnalyticsPropertyInputSchema).output(GoogleAnalyticsMetadataOutputSchema).meta(readOnlyTool),
	runReport: ga.input(GoogleAnalyticsReportInputSchema).output(GoogleAnalyticsReportOutputSchema).meta(readOnlyTool),
	runRealtimeReport: ga.input(GoogleAnalyticsRealtimeReportInputSchema).output(GoogleAnalyticsReportOutputSchema).meta(readOnlyTool),
};

export type GoogleAnalyticsServiceInputs = InferContractRouterInputs<typeof GoogleAnalyticsServiceContract>;
export type GoogleAnalyticsServiceOutputs = InferContractRouterOutputs<typeof GoogleAnalyticsServiceContract>;
export type GoogleAnalyticsServiceClientContext = Pick<GoogleAnalyticsRequestOptions, 'timeoutMs'>;
export type IGoogleAnalyticsServiceContract = ContractRouterClient<typeof GoogleAnalyticsServiceContract, GoogleAnalyticsServiceClientContext>;
export type GoogleAnalyticsServiceCallOptions = NonNullable<Parameters<IGoogleAnalyticsServiceContract['getProperty']>[1]>;
