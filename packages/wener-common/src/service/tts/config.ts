import type { OpenAiTtsClientOptions } from '@wener/client/tts';
import { TTS_MAX_AUDIO_BYTES } from '@wener/client/tts';
import { z } from 'zod';

const label = z.string().trim().min(1).max(256);
const timeoutMs = z.number().int().min(1).max(2_147_483_647).optional();
const maxAudioBytes = z.number().int().min(1).max(TTS_MAX_AUDIO_BYTES).optional();
const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
export const EdgeTtsServiceOptionsSchema = z.strictObject({ voice: label.optional(), timeoutMs, maxAudioBytes });
export const OpenAiTtsServiceOptionsSchema = z
	.strictObject({
		apiKey: z
			.string()
			.min(1)
			.refine((v) => !/[\r\n]/u.test(v))
			.optional(),
		apiKeyEnv: envName.optional(),
		model: label.optional(),
		voice: label.optional(),
		timeoutMs,
		maxAudioBytes,
	})
	.superRefine((v, context) => {
		if (v.apiKey !== undefined && v.apiKeyEnv !== undefined)
			context.addIssue({ code: 'custom', message: 'Choose one API key source' });
	});
export const EdgeTtsServiceConfigSchema = z.object({ options: EdgeTtsServiceOptionsSchema.default({}) });
export const OpenAiTtsServiceConfigSchema = z.object({
	baseUrl: z.url().optional(),
	options: OpenAiTtsServiceOptionsSchema.default({}),
});
export type EdgeTtsServiceOptions = z.input<typeof EdgeTtsServiceOptionsSchema>;
export type OpenAiTtsServiceOptions = z.input<typeof OpenAiTtsServiceOptionsSchema>;

/** Pure schemas above; only the provider factory calls this host-port resolver. */
export function resolveOpenAiTtsConnectionOptions(
	config: unknown,
	getEnv?: (name: string) => string | undefined,
): OpenAiTtsClientOptions {
	try {
		const { baseUrl, options } = OpenAiTtsServiceConfigSchema.parse(config);
		const { apiKey, apiKeyEnv, ...rest } = options;
		const reference = apiKey === undefined ? undefined : /^env:\/\/([A-Za-z_][A-Za-z0-9_]*)$/u.exec(apiKey);
		if (apiKey?.startsWith('env://') && !reference) throw new Error();
		const name = apiKeyEnv ?? reference?.[1];
		const resolvedKey = name ? getEnv?.(name) : apiKey;
		if (name && (typeof resolvedKey !== 'string' || !resolvedKey.trim())) throw new Error();
		return { ...rest, baseUrl, apiKey: resolvedKey };
	} catch {
		throw new TypeError('Invalid OpenAI TTS configuration');
	}
}
