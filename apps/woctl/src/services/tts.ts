import type { TtsAudio, TtsRequest, TtsVoiceList } from '@wener/client/tts';
import { TTS_MAX_TEXT_BYTES } from '@wener/client/tts';
import { type CliOptions, CliUsageError } from '@wener/common/cli';
import { createServiceProviderAdapter, createServiceRuntime, ServiceProviderRegistry, type ServiceRuntimeClient } from '@wener/common/service/runtime';
import { EdgeTtsServiceProvider } from '@wener/common/service/provider/edge-tts';
import { preflightTtsRequest, TtsRequestSchema } from '@wener/common/service/tts';
import { createTtsServiceToolClient } from '@wener/common/service/tts/client';
import { optionNumber, optionString, readCommandText, writeCommandOutput } from '../command-utils';
import { capabilityCandidates, capabilityOptions, capabilityType, listCapabilityServices, selectCapabilityService } from '../commands/service-capability';
import type { WoctlCommand, CliExecution } from '../createCli';

const builtinService = 'builtin-edge-tts';
const selectionOptions = capabilityOptions.filter((option) => ['service', 'provider', 'api', 'list-services'].includes(option.name));

function selection(options: CliOptions, context: CliExecution): { builtin: boolean; service: string; provider?: string } {
	const resolved = context.getConfigContext(options);
	const provider = capabilityType(options, context);
	const canonical = (name: string) => context.resolveServiceProvider?.(name) ?? name;
	const explicit = optionString(options, 'service');
	const configured = resolved.configuredServices ?? resolved.services;
	const hasConfiguredTts = Object.values(configured).some((config) => context.getServiceCapabilities?.(config.provider).includes('tts'));
	if (!hasConfiguredTts && !Object.hasOwn(resolved.defaults, 'tts')
		&& (!explicit || explicit === builtinService) && !Object.hasOwn(configured, builtinService)
		&& (!provider || canonical(provider) === 'edge-tts')) {
		return { builtin: true, service: builtinService, provider: 'edge-tts' };
	}
	const service = selectCapabilityService(context, resolved, 'tts', options);
	return { builtin: false, service, provider: canonical(resolved.services[service].provider) };
}

function listServices(options: CliOptions, context: CliExecution): void {
	const resolved = context.getConfigContext(options);
	if (capabilityCandidates(context, resolved, 'tts', capabilityType(options, context)).length) {
		listCapabilityServices(context, options, 'tts');
		return;
	}
	let builtin = false;
	try { builtin = selection(options, context).builtin; } catch { /* Disabled or explicitly unavailable services stay unavailable. */ }
	writeCommandOutput(builtin ? [{ name: builtinService, provider: 'edge-tts', readOnly: true, default: true, builtin: true }] : [], options, context);
}

async function withTts<T>(options: CliOptions, context: CliExecution, run: (runtime: ServiceRuntimeClient, service: string, provider?: string) => Promise<T>): Promise<T> {
	const selected = selection(options, context);
	if (!selected.builtin) return context.withServices(options, (runtime) => run(runtime, selected.service, selected.provider));
	const runtime = createServiceRuntime({
		context: { services: { [builtinService]: { provider: 'edge-tts', readOnly: true, options: {} } } },
		providers: new ServiceProviderRegistry([createServiceProviderAdapter(EdgeTtsServiceProvider)]),
		fetch: context.host.fetch,
		edgeTtsSocketFactory: context.host.edgeTtsSocketFactory,
	});
	try { return await run(runtime, builtinService, 'edge-tts'); }
	finally { await runtime.close(); }
}

function requestOptions(options: CliOptions, text: string, audioFormat?: string): TtsRequest {
	const parsed = TtsRequestSchema.safeParse({
		text,
		voice: optionString(options, 'voice'), model: optionString(options, 'model'),
		format: audioFormat ?? optionString(options, 'audio-format'), instructions: optionString(options, 'instructions'),
		speed: optionNumber(options, 'speed', { min: 0.25, max: 4 }),
		rate: optionString(options, 'rate'), pitch: optionString(options, 'pitch'), volume: optionString(options, 'volume'),
	});
	if (!parsed.success) throw new CliUsageError('Invalid TTS input; inspect tts --help');
	return parsed.data;
}

function providerRequest(provider: string, request: TtsRequest, options: unknown): TtsRequest {
	try { return preflightTtsRequest(provider, request, options); }
	catch { throw new CliUsageError('Invalid TTS request or configuration; inspect tts --help'); }
}

async function synthesize(args: readonly string[], options: CliOptions, context: CliExecution): Promise<void> {
	if (options['list-services']) return listServices(options, context);
	const target = optionString(options, 'output-file');
	if (!target?.trim()) throw new CliUsageError('Provide an audio destination with --output-file');
	const extension = /\.([A-Za-z0-9]+)$/u.exec(target)?.[1]?.toLowerCase();
	const inferredFormat = extension === 'ogg' ? 'opus' : extension && ['mp3', 'wav', 'opus', 'aac', 'flac', 'pcm'].includes(extension) ? extension : undefined;
	const explicitFormat = optionString(options, 'audio-format');
	if (explicitFormat && inferredFormat && explicitFormat !== inferredFormat)
		throw new CliUsageError('--audio-format conflicts with the output file extension');
	const audioFormat = explicitFormat ?? inferredFormat;
	const binaryStream = context.stdoutStream ?? context.writeStream;
	if (target === '-') {
		if (!binaryStream || binaryStream.locked) throw new CliUsageError('Host does not provide an available binary stdout stream');
		if (options.json || options.output !== undefined || options.format !== undefined) throw new CliUsageError('Binary stdout cannot be combined with formatted output');
	} else if (!context.host.writeBytes) throw new CliUsageError('Host does not support binary file output');
	const inline = optionString(options, 'text');
	const input = optionString(options, 'input');
	if (args.length > 1 || Number(args.length > 0) + Number(inline !== undefined) + Number(input !== undefined) !== 1)
		throw new CliUsageError('Provide one text argument, --text, or --input @file|-');
	if (input !== undefined && input !== '-' && (!input.startsWith('@') || input.length === 1))
		throw new CliUsageError('--input expects @file or - for stdin');
	const selected = selection(options, context);
	const providerOptions = selected.builtin ? {} : context.getConfigContext(options).services[selected.service].options;
	providerRequest(selected.provider ?? '', requestOptions(options, 'Validate options before reading input', audioFormat), providerOptions);
	const text = input === undefined ? (inline ?? args[0]) : await readCommandText(input, context, { maxBytes: TTS_MAX_TEXT_BYTES });
	const request = providerRequest(selected.provider ?? '', requestOptions(options, text, audioFormat), providerOptions);
	await withTts(options, context, async (runtime, service, provider) => {
		const client = await createTtsServiceToolClient(runtime, service, { signal: context.signal });
		const result: TtsAudio = await client.synthesize(request, { signal: context.signal });
		context.signal.throwIfAborted();
		if (target === '-') {
			const writer = binaryStream!.getWriter();
			try { await writer.write(result.audio); context.signal.throwIfAborted(); }
			finally { writer.releaseLock(); }
			return;
		}
		await context.host.writeBytes!(target, result.audio, { signal: context.signal });
		context.signal.throwIfAborted();
		if (options.json || options.output !== undefined || options.format !== undefined) {
			writeCommandOutput({ file: target, service, provider, format: result.format, mediaType: result.mediaType,
				byteLength: result.audio.byteLength, voice: result.voice, model: result.model }, options, context);
		} else context.stdout(target);
	});
}

export function createTtsCommand(): WoctlCommand {
	return {
		name: 'tts', description: 'Generate speech using a configured TTS service or built-in Edge TTS',
		output: 'custom', arguments: '[text]',
		examples: [
			{ command: 'woctl tts "Hello" --output-file hello.mp3' },
			{ command: 'woctl tts voices --locale zh-CN --json' },
		],
		options: [
			...selectionOptions,
			{ name: 'text', description: 'Literal text to speak' },
			{ name: 'input', description: 'Text input from @file or - for stdin' },
			{ name: 'output-file', description: 'Audio destination path; - writes binary audio to stdout' },
			{ name: 'voice', description: 'Provider voice ID; Edge defaults to zh-CN-XiaoxiaoNeural' },
			{ name: 'model', description: 'Model ID for a model-backed provider' },
			{ name: 'audio-format', description: 'Audio format: mp3, wav, opus, aac, flac, pcm (Edge: mp3)' },
			{ name: 'speed', description: 'Speaking speed ratio from 0.25 through 4' },
			{ name: 'rate', description: 'Edge speaking rate, such as +10%; conflicts with --speed' },
			{ name: 'pitch', description: 'Edge pitch, such as +5Hz' },
			{ name: 'volume', description: 'Edge volume, such as -10%' },
			{ name: 'instructions', description: 'Model-specific speech instructions' },
		],
		run: ({ args, options }, context) => synthesize(args, options, context),
		commands: [
			{ name: 'speak', description: 'Generate speech from text', arguments: '[text]', output: 'custom',
				run: ({ args, options }, context) => synthesize(args, options, context) },
			{ name: 'voices', description: 'List available voices; availability depends on the provider', output: 'custom', options: [
				{ name: 'locale', description: 'Filter voices by locale, such as zh-CN' },
				{ name: 'query', description: 'Search voice IDs and names' },
			], async run({ options }, context) {
				if (options['list-services']) return listServices(options, context);
				await withTts(options, context, async (runtime, service) => {
					const client = await createTtsServiceToolClient(runtime, service, { signal: context.signal });
					const result: TtsVoiceList = await client.listVoices({ locale: optionString(options, 'locale'), query: optionString(options, 'query') }, { signal: context.signal });
					if (options.json) writeCommandOutput({ service, ...result }, options, context);
					else {
						if (!result.supported) context.stderr?.('Voice discovery is unavailable for this provider; select a voice explicitly.');
						writeCommandOutput(result.voices, options, context);
					}
				});
			} },
		],
	};
}
