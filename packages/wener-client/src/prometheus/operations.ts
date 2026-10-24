import { PrometheusClientError } from './errors';

export type PrometheusTime = number | string;
export type PrometheusScalarValue = [timestamp: number, value: string];
export type PrometheusMetric = Record<string, string>;

export interface PrometheusVectorSample {
	metric: PrometheusMetric;
	value: PrometheusScalarValue;
}
export interface PrometheusMatrixSeries {
	metric: PrometheusMetric;
	values: PrometheusScalarValue[];
}
export type PrometheusResultType = 'scalar' | 'string' | 'vector' | 'matrix';
export type PrometheusQueryResult =
	| { resultType: 'scalar'; result: PrometheusScalarValue }
	| { resultType: 'string'; result: PrometheusScalarValue }
	| { resultType: 'vector'; result: PrometheusVectorSample[] }
	| { resultType: 'matrix'; result: PrometheusMatrixSeries[] };

export interface PrometheusSuccessEnvelope<T> {
	status: 'success';
	data: T;
	warnings: string[];
}
export interface PrometheusQueryResponse extends PrometheusSuccessEnvelope<PrometheusQueryResult> {}
export interface PrometheusSeriesResponse extends PrometheusSuccessEnvelope<PrometheusMetric[]> {}
export interface PrometheusLabelValuesResponse extends PrometheusSuccessEnvelope<string[]> {}
export interface PrometheusMetadata {
	[metricName: string]: Array<{ type: string; help: string; unit: string }>;
}
export interface PrometheusMetadataResponse extends PrometheusSuccessEnvelope<PrometheusMetadata> {}

export interface PrometheusQueryInput {
	query: string;
	time?: PrometheusTime;
	timeout?: string;
}
export interface PrometheusQueryRangeInput {
	query: string;
	start: PrometheusTime;
	end: PrometheusTime;
	step: PrometheusTime;
	timeout?: string;
}
export interface PrometheusSeriesInput {
	match: readonly string[];
	start?: PrometheusTime;
	end?: PrometheusTime;
}
export interface PrometheusLabelsInput {
	match?: readonly string[];
	start?: PrometheusTime;
	end?: PrometheusTime;
}
export interface PrometheusLabelValuesInput {
	label: string;
	match?: readonly string[];
	start?: PrometheusTime;
	end?: PrometheusTime;
}
export interface PrometheusMetadataInput {
	limit?: number;
	metric?: string;
}

export function invalidRequest(message = 'Invalid Prometheus request'): never {
	throw new PrometheusClientError('INVALID_REQUEST', message);
}
export function invalidResponse(): never {
	throw new PrometheusClientError('INVALID_RESPONSE', 'Prometheus returned an invalid response');
}

function object(value: unknown): Record<string, unknown> {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) return invalidResponse();
	return value as Record<string, unknown>;
}
function text(value: unknown, name: string, max = 1024 * 1024): string {
	if (typeof value !== 'string' || !value.trim() || new TextEncoder().encode(value).byteLength > max)
		return invalidRequest(`Invalid Prometheus ${name}`);
	return value;
}
function time(value: unknown, name: string): string | number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() && new TextEncoder().encode(value).byteLength <= 256) return value;
	return invalidRequest(`Invalid Prometheus ${name}`);
}
function metric(value: unknown): PrometheusMetric {
	const input = object(value);
	const output: PrometheusMetric = {};
	for (const [key, entry] of Object.entries(input)) {
		if (!key || typeof entry !== 'string') return invalidResponse();
		output[key] = entry;
	}
	return output;
}
function sample(value: unknown): PrometheusScalarValue {
	if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== 'number' || !Number.isFinite(value[0]) || typeof value[1] !== 'string')
		return invalidResponse();
	return [value[0], value[1]];
}
function samples(value: unknown): PrometheusScalarValue[] {
	if (!Array.isArray(value) || value.length > 1_000_000) return invalidResponse();
	return value.map(sample);
}
function result(value: unknown, resultType: unknown): PrometheusQueryResult {
	switch (resultType) {
		case 'scalar':
		case 'string':
			return { resultType, result: sample(value) };
		case 'vector': {
			if (!Array.isArray(value) || value.length > 1_000_000) return invalidResponse();
			return {
				resultType,
				result: value.map((entry) => {
					const row = object(entry);
					return { metric: metric(row.metric), value: sample(row.value) };
				}),
			};
		}
		case 'matrix': {
			if (!Array.isArray(value) || value.length > 1_000_000) return invalidResponse();
			return {
				resultType,
				result: value.map((entry) => {
					const row = object(entry);
					return { metric: metric(row.metric), values: samples(row.values) };
				}),
			};
		}
		default:
			return invalidResponse();
	}
}

function warnings(value: unknown): string[] {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > 10_000 || !value.every((entry) => typeof entry === 'string')) return invalidResponse();
	return [...value];
}

export function parseEnvelope(value: unknown): { data: unknown; warnings: string[] } {
	const envelope = object(value);
	if (envelope.status !== 'success') {
		throw new PrometheusClientError('REQUEST_FAILED', 'Prometheus request returned an error');
	}
	if (envelope.data === null || typeof envelope.data !== 'object') return invalidResponse();
	return { data: envelope.data, warnings: warnings(envelope.warnings) };
}

export function parseQueryEnvelope(value: unknown): PrometheusQueryResponse {
	const envelope = parseEnvelope(value);
	const data = object(envelope.data);
	return {
		status: 'success',
		data: result(data.result, data.resultType),
		warnings: envelope.warnings,
	};
}
export function parseSeriesEnvelope(value: unknown): PrometheusSeriesResponse {
	const envelope = parseEnvelope(value);
	if (!Array.isArray(envelope.data) || envelope.data.length > 1_000_000) return invalidResponse();
	return { status: 'success', data: envelope.data.map(metric), warnings: envelope.warnings };
}
export function parseLabelValuesEnvelope(value: unknown): PrometheusLabelValuesResponse {
	const envelope = parseEnvelope(value);
	if (!Array.isArray(envelope.data) || envelope.data.length > 1_000_000 || !envelope.data.every((entry) => typeof entry === 'string')) return invalidResponse();
	return { status: 'success', data: [...envelope.data], warnings: envelope.warnings };
}
export function parseMetadataEnvelope(value: unknown): PrometheusMetadataResponse {
	const envelope = parseEnvelope(value);
	const metadata = object(envelope.data);
	const data: PrometheusMetadata = {};
	for (const [name, entries] of Object.entries(metadata)) {
		if (!Array.isArray(entries) || entries.length > 100_000) return invalidResponse();
		data[name] = entries.map((entry) => {
			const item = object(entry);
			if (typeof item.type !== 'string' || typeof item.help !== 'string' || typeof item.unit !== 'string') return invalidResponse();
			return { type: item.type, help: item.help, unit: item.unit };
		});
	}
	return { status: 'success', data, warnings: envelope.warnings };
}

export function validateQueryInput(input: PrometheusQueryInput): Record<string, string> {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return invalidRequest();
	return {
		query: text(input.query, 'query'),
		...(input.time === undefined ? {} : { time: String(time(input.time, 'time')) }),
		...(input.timeout === undefined ? {} : { timeout: text(input.timeout, 'timeout', 256) }),
	};
}
export function validateQueryRangeInput(input: PrometheusQueryRangeInput): Record<string, string> {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return invalidRequest();
	return {
		query: text(input.query, 'query'),
		start: String(time(input.start, 'start')),
		end: String(time(input.end, 'end')),
		step: String(time(input.step, 'step')),
		...(input.timeout === undefined ? {} : { timeout: text(input.timeout, 'timeout', 256) }),
	};
}
export function validateSeriesInput(input: PrometheusSeriesInput): Record<string, string | string[]> {
	if (input === null || typeof input !== 'object' || Array.isArray(input) || !Array.isArray(input.match) || input.match.length === 0 || input.match.length > 10_000)
		return invalidRequest('Prometheus series requires match');
	if (!input.match.every((entry) => typeof entry === 'string' && entry.trim())) return invalidRequest('Invalid Prometheus match');
	return {
		'match[]': [...input.match],
		...(input.start === undefined ? {} : { start: String(time(input.start, 'start')) }),
		...(input.end === undefined ? {} : { end: String(time(input.end, 'end')) }),
	};
}
export function validateLabelsInput(input: PrometheusLabelsInput): Record<string, string | string[]> {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return invalidRequest();
	if (input.match !== undefined && (!Array.isArray(input.match) || input.match.length > 10_000 || !input.match.every((entry) => typeof entry === 'string' && entry.trim()))) return invalidRequest('Invalid Prometheus match');
	return {
		...(input.match === undefined ? {} : { 'match[]': [...input.match] }),
		...(input.start === undefined ? {} : { start: String(time(input.start, 'start')) }),
		...(input.end === undefined ? {} : { end: String(time(input.end, 'end')) }),
	};
}
export function validateLabelValuesInput(input: PrometheusLabelValuesInput): Record<string, string | string[]> {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return invalidRequest();
	const label = text(input.label, 'label', 256);
	return { label, ...validateLabelsInput(input) };
}
export function validateMetadataInput(input: PrometheusMetadataInput = {}): Record<string, string> {
	if (input === null || typeof input !== 'object' || Array.isArray(input)) return invalidRequest();
	if (input.limit !== undefined && (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 1_000_000)) return invalidRequest('Invalid Prometheus limit');
	return {
		...(input.limit === undefined ? {} : { limit: String(input.limit) }),
		...(input.metric === undefined ? {} : { metric: text(input.metric, 'metric', 256) }),
	};
}
