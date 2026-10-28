import { validateOpenObserveStreamSettingsUpdate, type OpenObserveJsonObject, type OpenObserveUpdateStreamSettings } from '@wener/client/openobserve';
import { type ServiceCliInputContext, type ServiceCliOperation, serviceCliString } from '../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../cli/ServiceCliInputError';
import type { IOpenObserveService } from './index';
import { commonInput, integerOption, requiredStream, timeRange } from './input';
import { sanitizeOpenObserveOutput } from './sanitize';

function confirm(context: ServiceCliInputContext) {
	if (context.options.yes !== true) throw new ServiceCliInputError('OpenObserve write operations require --yes');
}
async function payload(context: ServiceCliInputContext, source = context.args[0] ?? '-'): Promise<string> {
	let value = source;
	if (source.startsWith('@') || source === '-') {
		try { value = await context.readText(source, { label: 'OpenObserve input', maxBytes: 1024 * 1024 }); }
		catch { throw new ServiceCliInputError('Unable to read OpenObserve input'); }
	}
	if (!value.trim() || new TextEncoder().encode(value).byteLength > 1024 * 1024) throw new ServiceCliInputError('OpenObserve input must contain 1–1048576 UTF-8 bytes');
	return value;
}
function records(text: string, ndjson: boolean): OpenObserveJsonObject[] {
	try {
		const value: unknown = ndjson ? text.split(/\r?\n/u).filter((line) => line.trim()).map((line) => JSON.parse(line)) : JSON.parse(text);
		if (!Array.isArray(value) || !value.length || value.length > 10_000 || value.some((entry) => !entry || typeof entry !== 'object' || Array.isArray(entry))) throw new Error();
		return value as OpenObserveJsonObject[];
	} catch { throw new ServiceCliInputError('Invalid OpenObserve ingestion records'); }
}
export const OpenObserveExtraCommands: readonly ServiceCliOperation<IOpenObserveService>[] = [
	{ name: 'health', description: 'Check the healthz protocol endpoint', prepare() { return async (service, options) => sanitizeOpenObserveOutput(await service.health(options)); } },
	{ group: 'stream', name: 'settings', description: 'Show stream settings', arguments: '[stream]', prepare({ args, options }) {
		const input = { ...commonInput(options), stream: requiredStream(options, args[0]) };
		return async (service, callOptions) => sanitizeOpenObserveOutput(await service.getStreamSettings(input, callOptions));
	} },
	{ group: 'stream', name: 'update', description: 'Update stream settings; requires a writable service and --yes', arguments: '[stream]', mutating: true,
		options: [{ name: 'input', description: 'JSON settings object, @file or -' }, { name: 'yes', type: 'boolean', description: 'Confirm writes' }],
		async prepare(context) {
			confirm(context);
			const base = { ...commonInput(context.options), stream: requiredStream(context.options, context.args[0]) };
			const text = await payload(context, serviceCliString(context.options, 'input') ?? '-');
			let settings: OpenObserveUpdateStreamSettings;
			try {
				const data: unknown = JSON.parse(text);
				if (!data || typeof data !== 'object' || Array.isArray(data) || !Object.keys(data).length) throw new Error();
				settings = validateOpenObserveStreamSettingsUpdate(data);
			} catch { throw new ServiceCliInputError('Invalid OpenObserve settings'); }
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.updateStreamSettings({ ...base, settings }, callOptions));
		},
	},
	{ group: 'stream', name: 'delete', aliases: ['rm'], description: 'Delete a stream; requires a writable service and --yes', arguments: '[stream]', mutating: true,
		options: [{ name: 'yes', type: 'boolean', description: 'Confirm deletion' }, { name: 'delete-all', type: 'boolean', description: 'Also delete associated resources' }],
		prepare(context) {
			confirm(context);
			const input = { ...commonInput(context.options), stream: requiredStream(context.options, context.args[0]), deleteAll: context.options['delete-all'] === true };
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.deleteStream(input, callOptions));
		},
	},
	...(['json', 'multi'] as const).map((format): ServiceCliOperation<IOpenObserveService> => ({
		group: 'ingest', name: format, description: format === 'json' ? 'Ingest a JSON array of objects' : 'Ingest an NDJSON stream of objects', arguments: '[input]', mutating: true,
		options: [{ name: 'yes', type: 'boolean', description: 'Confirm writes' }],
		async prepare(context) {
			confirm(context);
			const { organization, streamType } = commonInput(context.options);
			if (streamType !== undefined && streamType !== 'logs') throw new ServiceCliInputError('JSON/NDJSON ingestion only supports --type logs');
			const stream = requiredStream(context.options);
			const data = records(await payload(context), format === 'multi');
			return async (service, callOptions) => sanitizeOpenObserveOutput(await (format === 'json' ? service.ingestJson({ organization, stream, records: data }, callOptions) : service.ingestMulti({ organization, stream, records: data }, callOptions)));
		},
	})),
	{ name: 'values', description: 'Read distinct field values', arguments: '<field...>',
		options: [{ name: 'from', description: 'Start time; defaults to now-1h' }, { name: 'to', description: 'End time; defaults to now' }, { name: 'size', description: 'Number of values per field, 1–1000' }, { name: 'keyword', description: 'Filter values' }, { name: 'count', type: 'boolean', negatable: true, description: 'Use --no-count to skip counting' }],
		prepare({ args, options }) {
			const input = { ...commonInput(options), stream: requiredStream(options), fields: [...args], ...timeRange(options), size: integerOption(options, 'size', 1, 1000), keyword: serviceCliString(options, 'keyword'), noCount: options.count === false };
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.getValues(input, callOptions));
		},
	},
	{ name: 'around', description: 'Read logs around a microsecond timestamp', arguments: '<microseconds>', options: [{ name: 'size', description: 'Number of results, 1–1000' }],
		prepare({ args, options }) {
			const key = /^\d+$/u.test(args[0] ?? '') ? Number(args[0]) : NaN;
			if (!Number.isSafeInteger(key) || key < 0) throw new ServiceCliInputError('Invalid OpenObserve timestamp');
			const input = { ...commonInput(options), stream: requiredStream(options), key, size: integerOption(options, 'size', 1, 1000) };
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.searchAround(input, callOptions));
		},
	},
];
