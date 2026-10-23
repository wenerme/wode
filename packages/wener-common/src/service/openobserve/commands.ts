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
	{ name: 'health', description: '检查 healthz 协议端点', prepare() { return async (service, options) => sanitizeOpenObserveOutput(await service.health(options)); } },
	{ group: 'stream', name: 'settings', description: '查看 stream 设置', arguments: '[stream]', prepare({ args, options }) {
		const input = { ...commonInput(options), stream: requiredStream(options, args[0]) };
		return async (service, callOptions) => sanitizeOpenObserveOutput(await service.getStreamSettings(input, callOptions));
	} },
	{ group: 'stream', name: 'update', description: '更新 stream 设置，需要 writable service 与 --yes', arguments: '[stream]', mutating: true,
		options: [{ name: 'input', description: 'JSON 设置对象、@file 或 -' }, { name: 'yes', type: 'boolean', description: '确认写入' }],
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
	{ group: 'stream', name: 'delete', aliases: ['rm'], description: '删除 stream，需要 writable service 与 --yes', arguments: '[stream]', mutating: true,
		options: [{ name: 'yes', type: 'boolean', description: '确认删除' }, { name: 'delete-all', type: 'boolean', description: '同时删除关联资源' }],
		prepare(context) {
			confirm(context);
			const input = { ...commonInput(context.options), stream: requiredStream(context.options, context.args[0]), deleteAll: context.options['delete-all'] === true };
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.deleteStream(input, callOptions));
		},
	},
	...(['json', 'multi'] as const).map((format): ServiceCliOperation<IOpenObserveService> => ({
		group: 'ingest', name: format, description: format === 'json' ? '写入 JSON 对象数组' : '写入 NDJSON 对象流', arguments: '[input]', mutating: true,
		options: [{ name: 'yes', type: 'boolean', description: '确认写入' }],
		async prepare(context) {
			confirm(context);
			const { organization, streamType } = commonInput(context.options);
			if (streamType !== undefined && streamType !== 'logs') throw new ServiceCliInputError('JSON/NDJSON 写入只支持 --type logs');
			const stream = requiredStream(context.options);
			const data = records(await payload(context), format === 'multi');
			return async (service, callOptions) => sanitizeOpenObserveOutput(await (format === 'json' ? service.ingestJson({ organization, stream, records: data }, callOptions) : service.ingestMulti({ organization, stream, records: data }, callOptions)));
		},
	})),
	{ name: 'values', description: '读取字段 distinct values', arguments: '<field...>',
		options: [{ name: 'from', description: '开始时间，默认 now-1h' }, { name: 'to', description: '结束时间，默认 now' }, { name: 'size', description: '每字段值数量，1–1000' }, { name: 'keyword', description: '过滤值' }, { name: 'count', type: 'boolean', negatable: true, description: '--no-count 跳过计数' }],
		prepare({ args, options }) {
			const input = { ...commonInput(options), stream: requiredStream(options), fields: [...args], ...timeRange(options), size: integerOption(options, 'size', 1, 1000), keyword: serviceCliString(options, 'keyword'), noCount: options.count === false };
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.getValues(input, callOptions));
		},
	},
	{ name: 'around', description: '读取微秒时间戳附近日志', arguments: '<microseconds>', options: [{ name: 'size', description: '结果数量，1–1000' }],
		prepare({ args, options }) {
			const key = /^\d+$/u.test(args[0] ?? '') ? Number(args[0]) : NaN;
			if (!Number.isSafeInteger(key) || key < 0) throw new ServiceCliInputError('Invalid OpenObserve timestamp');
			const input = { ...commonInput(options), stream: requiredStream(options), key, size: integerOption(options, 'size', 1, 1000) };
			return async (service, callOptions) => sanitizeOpenObserveOutput(await service.searchAround(input, callOptions));
		},
	},
];
