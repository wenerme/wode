import type {
	PrometheusLabelsInput,
	PrometheusLabelValuesInput,
	PrometheusMetadataInput,
	PrometheusQueryInput,
	PrometheusQueryRangeInput,
	PrometheusSeriesInput,
} from '@wener/client/prometheus';
import { type ServiceCliOptions, serviceCliString, serviceCliStrings } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';

function text(options: ServiceCliOptions, name: string): string | undefined {
	const value = serviceCliString(options, name);
	return value === undefined ? undefined : value.trim() || (() => { throw new ServiceCliInputError(`Prometheus --${name} is empty`); })();
}
function time(value: string | undefined, name: string, fallback?: string): string | number | undefined {
	const input = value ?? fallback;
	if (input === undefined) return undefined;
	if (/^\d+(?:\.\d+)?$/u.test(input)) {
		const number = Number(input);
		if (Number.isFinite(number)) return number;
	}
	const relative = /^now(?:-(\d+(?:\.\d+)?)([smhdw]))?$/u.exec(input);
	if (relative) {
		const units = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 } as const;
		return Math.floor(Date.now() / 1000 - Number(relative[1] ?? 0) * (units[relative[2] as keyof typeof units] ?? 0));
	}
	if (/^\d{4}-\d\d-\d\dT/u.test(input)) {
		const parsed = Date.parse(input);
		if (Number.isFinite(parsed)) return parsed / 1000;
	}
	throw new ServiceCliInputError(`Invalid Prometheus ${name}`);
}
function step(value: string | undefined): string | number {
	const input = value ?? '60';
	if (/^\d+(?:\.\d+)?$/u.test(input)) {
		const number = Number(input);
		if (Number.isFinite(number) && number > 0) return number;
	}
	if (/^\d+(?:\.\d+)?[smhdw]$/u.test(input)) return input;
	throw new ServiceCliInputError('Invalid Prometheus step');
}
function matches(options: ServiceCliOptions): string[] | undefined {
	const value = serviceCliStrings(options, 'match');
	if (value === undefined) return undefined;
	if (value.length === 0 || value.some((item) => !item.trim())) throw new ServiceCliInputError('Prometheus --match is empty');
	return value;
}
export function queryInput(options: ServiceCliOptions, query: string): PrometheusQueryInput {
	const value: PrometheusQueryInput = { query: query.trim() };
	if (!value.query) throw new ServiceCliInputError('Prometheus query is required');
	const at = time(text(options, 'time'), 'time');
	const timeout = text(options, 'timeout');
	if (at !== undefined) value.time = at;
	if (timeout !== undefined) value.timeout = timeout;
	return value;
}
export function queryRangeInput(options: ServiceCliOptions, query: string): PrometheusQueryRangeInput {
	const value: PrometheusQueryRangeInput = {
		query: query.trim(),
		start: time(text(options, 'start'), 'start', 'now-1h')!,
		end: time(text(options, 'end'), 'end', 'now')!,
		step: step(text(options, 'step')),
	};
	if (!value.query) throw new ServiceCliInputError('Prometheus query is required');
	const timeout = text(options, 'timeout');
	if (timeout !== undefined) value.timeout = timeout;
	return value;
}
export function seriesInput(options: ServiceCliOptions): PrometheusSeriesInput {
	const match = matches(options);
	if (!match) throw new ServiceCliInputError('Prometheus --match is required');
	return { match, start: time(text(options, 'start'), 'start'), end: time(text(options, 'end'), 'end') };
}
export function labelsInput(options: ServiceCliOptions): PrometheusLabelsInput {
	return { match: matches(options), start: time(text(options, 'start'), 'start'), end: time(text(options, 'end'), 'end') };
}
export function labelValuesInput(options: ServiceCliOptions, label: string): PrometheusLabelValuesInput {
	if (!label.trim()) throw new ServiceCliInputError('Prometheus label name is required');
	return { label, match: matches(options), start: time(text(options, 'start'), 'start'), end: time(text(options, 'end'), 'end') };
}
export function metadataInput(options: ServiceCliOptions): PrometheusMetadataInput {
	const limit = text(options, 'limit');
	let parsed: number | undefined;
	if (limit !== undefined) {
		parsed = /^\d+$/u.test(limit) ? Number(limit) : NaN;
		if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 1_000_000) throw new ServiceCliInputError('Invalid Prometheus --limit');
	}
	return { ...(parsed === undefined ? {} : { limit: parsed }), ...(text(options, 'metric') === undefined ? {} : { metric: text(options, 'metric') }) };
}
