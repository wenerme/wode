import { OpenObserveClientError } from './errors';

export type OpenObserveJsonValue = null | boolean | number | string | OpenObserveJsonValue[] | OpenObserveJsonObject;
export interface OpenObserveJsonObject { [key: string]: OpenObserveJsonValue }
export interface OpenObserveStreamInput {
	organization?: string;
	stream: string;
	streamType?: 'logs' | 'metrics' | 'traces';
}
export type OpenObserveGetStreamSettingsInput = OpenObserveStreamInput;
export interface OpenObserveHealthResult { status: 'ok' }
export interface OpenObserveStreamPartition {
	field: string;
	types?: 'value' | 'prefix' | { hash: number };
	disabled?: boolean;
}
export interface OpenObserveStreamSettings {
	/** Legacy string map values are normalized to partition objects. */
	partition_keys?: OpenObserveStreamPartition[] | Record<string, OpenObserveStreamPartition>;
	index_fields?: string[];
	full_text_search_keys?: string[];
	bloom_filter_fields?: string[];
	defined_schema_fields?: string[];
	data_retention?: number;
	flatten_level?: number;
	max_query_range?: number;
	store_original_data?: boolean;
	approx_partition?: boolean;
	index_original_data?: boolean;
	index_all_values?: boolean;
	extended_retention_days?: OpenObserveJsonValue[];
}
export interface OpenObserveSettingsUpdate<T> { add?: T[]; remove?: T[] }
export interface OpenObserveUpdateStreamSettings {
	partition_keys?: OpenObserveSettingsUpdate<OpenObserveStreamPartition>;
	index_fields?: OpenObserveSettingsUpdate<string>;
	full_text_search_keys?: OpenObserveSettingsUpdate<string>;
	bloom_filter_fields?: OpenObserveSettingsUpdate<string>;
	defined_schema_fields?: OpenObserveSettingsUpdate<string>;
	data_retention?: number;
	flatten_level?: number;
	max_query_range?: number;
	store_original_data?: boolean;
	approx_partition?: boolean;
	index_original_data?: boolean;
	index_all_values?: boolean;
	extended_retention_days?: OpenObserveSettingsUpdate<OpenObserveJsonValue>;
}
export interface OpenObserveUpdateStreamSettingsInput extends OpenObserveStreamInput {
	settings: OpenObserveUpdateStreamSettings;
}
export interface OpenObserveStreamSettingsResult {
	organization: string;
	stream: string;
	streamType: 'logs' | 'metrics' | 'traces';
	settings: OpenObserveStreamSettings;
}
export interface OpenObserveDeleteStreamInput extends OpenObserveStreamInput { deleteAll?: boolean }
export interface OpenObserveMutationResult { code: number; message?: string }
export interface OpenObserveIngestJsonInput {
	organization?: string;
	stream: string;
	records: readonly OpenObserveJsonObject[];
}
export interface OpenObserveIngestMultiInput {
	organization?: string;
	stream: string;
	/** Objects are serialized as NDJSON. Strings must contain one JSON object per nonempty line. */
	records: readonly OpenObserveJsonObject[] | string;
}
export interface OpenObserveIngestResult {
	code: number;
	status: Array<{ name: string; successful: number; failed: number; error?: string }>;
}
export interface OpenObserveGetValuesInput extends OpenObserveStreamInput {
	fields: readonly string[];
	startTimeMicros: number;
	endTimeMicros: number;
	size?: number;
	keyword?: string;
	noCount?: boolean;
}
export interface OpenObserveGetValuesResult {
	hits: Array<{ field: string; values: Array<{ zo_sql_key: OpenObserveJsonValue; zo_sql_num?: number }> }>;
	total: number;
	tookMs?: number;
	scanBytes?: number;
}
export interface OpenObserveSearchAroundInput extends OpenObserveStreamInput { key: number; size?: number }

function invalid(response: boolean): never {
	throw new OpenObserveClientError(response ? 'INVALID_RESPONSE' : 'INVALID_REQUEST', response ? 'OpenObserve returned an invalid response' : 'Invalid OpenObserve request');
}
function object(value: unknown, response: boolean): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(response);
	return value as Record<string, unknown>;
}

/** Validate before serialization: JSON.stringify alone silently drops unsupported values. */
export function validateJson(value: unknown, response = false, ancestors = new Set<object>(), depth = 0): asserts value is OpenObserveJsonValue {
	if (depth > 64) invalid(response);
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
	if (typeof value === 'number' && Number.isFinite(value)) return;
	if (typeof value !== 'object' || ancestors.has(value)) invalid(response);
	const proto = Object.getPrototypeOf(value);
	if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) invalid(response);
	ancestors.add(value);
	for (const entry of Object.values(value)) validateJson(entry, response, ancestors, depth + 1);
	ancestors.delete(value);
}
const ARRAY_SETTINGS = new Set(['partition_keys', 'index_fields', 'full_text_search_keys', 'bloom_filter_fields', 'defined_schema_fields', 'extended_retention_days']);
const BOOLEAN_SETTINGS = new Set(['store_original_data', 'approx_partition', 'index_original_data', 'index_all_values']);
const NUMBER_SETTINGS = new Set(['data_retention', 'flatten_level', 'max_query_range']);
function fieldName(value: unknown, response: boolean): string {
	if (typeof value !== 'string' || !value.trim() || new TextEncoder().encode(value).length > 256 || /[\x00-\x1f\x7f]/u.test(value)) invalid(response);
	return value;
}
function partition(value: unknown, response: boolean): OpenObserveStreamPartition {
	const input = object(value, response);
	if (!response && Object.keys(input).some((key) => !['field', 'types', 'disabled'].includes(key))) invalid(false);
	const output: OpenObserveStreamPartition = { field: fieldName(input.field, response) };
	if (input.types !== undefined) {
		if (input.types === 'value' || input.types === 'prefix') output.types = input.types;
		else {
			const type = object(input.types, response);
			if (Object.keys(type).length !== 1 || typeof type.hash !== 'number' || !Number.isSafeInteger(type.hash) || type.hash <= 0) invalid(response);
			output.types = { hash: type.hash };
		}
	}
	if (input.disabled !== undefined) {
		if (typeof input.disabled !== 'boolean') invalid(response);
		output.disabled = input.disabled;
	}
	return output;
}
export function parseSettings(value: unknown, update: true): OpenObserveUpdateStreamSettings;
export function parseSettings(value: unknown, update: false): OpenObserveStreamSettings;
export function parseSettings(value: unknown, update: boolean): OpenObserveUpdateStreamSettings | OpenObserveStreamSettings {
	const settings = object(value, !update);
	const output: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(settings)) {
		if (ARRAY_SETTINGS.has(key)) {
			const parseArray = (items: unknown) => {
				if (!Array.isArray(items) || items.length > 1000) invalid(!update);
				if (key === 'extended_retention_days') validateJson(items, !update);
				else if (key === 'partition_keys') return items.map((item) => partition(item, !update));
				else items.forEach((item) => fieldName(item, !update));
				return items;
			};
			if (update) {
				const wrapper = object(entry, false);
				if (!Object.keys(wrapper).length) invalid(false);
				const parsed: Record<string, unknown> = {};
				for (const [operation, items] of Object.entries(wrapper)) {
					if (!['add', 'remove'].includes(operation)) invalid(false);
					parsed[operation] = parseArray(items);
				}
				output[key] = parsed;
			} else if (key === 'partition_keys' && !Array.isArray(entry)) {
				const entries = Object.entries(object(entry, true));
				if (entries.length > 1000) invalid(true);
				// StreamSettings::from supports legacy maps whose values are field names.
				output[key] = Object.fromEntries(entries.map(([name, item]) => [name, typeof item === 'string'
					? { field: fieldName(item, true), types: 'value', disabled: false }
					: partition(item, true)]));
			} else output[key] = parseArray(entry);
			continue;
		} else if (BOOLEAN_SETTINGS.has(key)) {
			if (typeof entry !== 'boolean') invalid(!update);
		} else if (NUMBER_SETTINGS.has(key)) {
			if (typeof entry !== 'number' || !Number.isSafeInteger(entry) || entry < (update && key === 'data_retention' ? 3 : 0)) invalid(!update);
		} else {
			// Read responses may add server fields; mutations must use a documented setting.
			if (update) invalid(false);
			continue;
		}
		output[key] = entry;
	}
	if (update && !Object.keys(output).length) invalid(false);
	return output;
}
/** Validate and parse update settings without configuration, credentials or HTTP access. */
export function validateOpenObserveStreamSettingsUpdate(value: unknown): OpenObserveUpdateStreamSettings {
	return parseSettings(value, true);
}
export function mutationResult(value: Record<string, unknown>): OpenObserveMutationResult {
	if (typeof value.code !== 'number' || !Number.isSafeInteger(value.code) || value.code < 200 || value.code >= 300) invalid(true);
	if (value.message !== undefined && typeof value.message !== 'string') invalid(true);
	// Server messages can contain request data. Preserve presence, with a safe fixed message.
	return { code: value.code, ...(value.message === undefined ? {} : { message: 'OpenObserve operation accepted' }) };
}
export function ingestionRecords(value: unknown): readonly OpenObserveJsonObject[] {
	if (!Array.isArray(value) || !value.length || value.length > 10_000) invalid(false);
	for (const entry of value) { object(entry, false); validateJson(entry); }
	return value;
}
export function ndjsonRecords(value: unknown): string {
	if (typeof value !== 'string') return ingestionRecords(value).map((entry) => JSON.stringify(entry)).join('\n') + '\n';
	if (!value.trim() || new TextEncoder().encode(value).length > 1024 * 1024) invalid(false);
	let parsed: unknown[];
	try { parsed = value.split(/\r?\n/u).filter((line) => line.trim()).map((line) => JSON.parse(line)); }
	catch { invalid(false); }
	ingestionRecords(parsed);
	return value.endsWith('\n') ? value : value + '\n';
}
export function ingestResult(value: Record<string, unknown>): OpenObserveIngestResult {
	const { code } = mutationResult(value);
	if (!Array.isArray(value.status) || !value.status.length || value.status.length > 10_000) invalid(true);
	return {
		code, status: value.status.map((entry) => {
			const row = object(entry, true);
			if (typeof row.name !== 'string' || !row.name || typeof row.successful !== 'number' || !Number.isSafeInteger(row.successful) || row.successful < 0 || typeof row.failed !== 'number' || !Number.isSafeInteger(row.failed) || row.failed < 0) invalid(true);
			return { name: row.name, successful: row.successful, failed: row.failed, ...(row.failed ? { error: 'OpenObserve reported failed ingestion records' } : {}) };
		}),
	};
}
