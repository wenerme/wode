import { isReadOnlySQL, type OpenObserveStreamType } from '@wener/client/openobserve';
import { type ServiceCliInputContext, type ServiceCliOptions, serviceCliString } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';

export function integerOption(options: ServiceCliOptions, name: string, min: number, max: number): number | undefined {
	const text = serviceCliString(options, name);
	if (text === undefined) return undefined;
	const value = /^\d+$/u.test(text) ? Number(text) : NaN;
	if (!Number.isSafeInteger(value) || value < min || value > max)
		throw new ServiceCliInputError(`Invalid OpenObserve --${name}`);
	return value;
}
export function commonInput(options: ServiceCliOptions) {
	const streamType = serviceCliString(options, 'stream-type');
	if (streamType !== undefined && !['logs', 'metrics', 'traces'].includes(streamType))
		throw new ServiceCliInputError('Invalid OpenObserve --type');
	const organization = serviceCliString(options, 'organization');
	if (organization !== undefined && !organization.trim()) throw new ServiceCliInputError('Invalid OpenObserve --org');
	return { organization, streamType: streamType as OpenObserveStreamType | undefined };
}
export function requiredStream(options: ServiceCliOptions, argument?: string): string {
	const value = argument ?? serviceCliString(options, 'stream');
	if (!value?.trim()) throw new ServiceCliInputError('OpenObserve --stream is required');
	return value;
}
export function timeRange(options: ServiceCliOptions, now = Date.now()) {
	function parse(value: string | undefined, fallback: number): number {
		if (value === undefined) return fallback;
		const relative = /^now(?:-(\d+)([smhd]))?$/u.exec(value);
		if (relative)
			return (
				(now -
					Number(relative[1] ?? 0) * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[relative[2] as 's'] ?? 0)) *
				1000
			);
		if (/^\d+$/u.test(value)) return Number(value);
		return Date.parse(value) * 1000;
	}
	const startTimeMicros = parse(serviceCliString(options, 'from'), (now - 3_600_000) * 1000);
	const endTimeMicros = parse(serviceCliString(options, 'to'), now * 1000);
	if (
		![startTimeMicros, endTimeMicros].every((value) => Number.isSafeInteger(value) && value >= 0) ||
		endTimeMicros <= startTimeMicros ||
		endTimeMicros - startTimeMicros > 86_400_000_000
	)
		throw new ServiceCliInputError('Invalid OpenObserve time range; maximum window is 24 hours');
	return { startTimeMicros, endTimeMicros };
}
export function queryInput(options: ServiceCliOptions) {
	const limit = integerOption(options, 'limit', 1, 1000);
	const size = integerOption(options, 'size', 1, 1000);
	if (limit !== undefined && size !== undefined && limit !== size)
		throw new ServiceCliInputError('OpenObserve --limit conflicts with --size');
	return {
		...commonInput(options),
		...timeRange(options),
		from: integerOption(options, 'offset', 0, 2_147_483_647),
		size: size ?? limit,
		timeoutSeconds: integerOption(options, 'timeout', 1, 60),
	};
}
export async function prepareQuery(context: ServiceCliInputContext): Promise<string> {
	const raw = context.args.join(' ').trim();
	const where = serviceCliString(context.options, 'where');
	const text = serviceCliString(context.options, 'text');
	if ([raw || undefined, where, text].filter((value) => value !== undefined).length > 1)
		throw new ServiceCliInputError('Choose SQL, --where or --text');
	let sql = raw;
	if (raw.startsWith('@') || raw === '-') {
		try {
			sql = await context.readText(raw, { label: 'OpenObserve SQL', maxBytes: 1024 * 1024 });
		} catch {
			throw new ServiceCliInputError('Unable to read OpenObserve SQL input');
		}
	}
	if (!raw) {
		const stream = requiredStream(context.options);
		const source = `"${stream.replaceAll('"', '""')}"`;
		if (where !== undefined && !where.trim()) throw new ServiceCliInputError('OpenObserve --where is empty');
		if (text !== undefined && !text.trim()) throw new ServiceCliInputError('OpenObserve --text is empty');
		sql = `SELECT * FROM ${source}${where ? ` WHERE ${where}` : text ? ` WHERE match_all('${text.replaceAll("'", "''")}')` : ''} ORDER BY _timestamp DESC`;
	}
	if (!sql.trim() || new TextEncoder().encode(sql).byteLength > 65_536)
		throw new ServiceCliInputError('OpenObserve SQL must contain 1–65536 UTF-8 bytes');
	if (!isReadOnlySQL(sql)) throw new ServiceCliInputError('OpenObserve SQL must be one read-only query');
	return sql;
}
