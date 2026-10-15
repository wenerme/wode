import type { ApiType } from '../../schema/ApiType';
import type { GenerateMessageCodec } from './codec';
import { BuiltinGenerateMessageCodecs } from './codecs';

const codecs = new Map<ApiType, GenerateMessageCodec>(BuiltinGenerateMessageCodecs.map((codec) => [codec.api, codec]));

/** Registers a codec for its protocol and any wire-compatible aliases, replacing an existing registration. */
export function registerGenerateMessageCodec(codec: GenerateMessageCodec, aliases: readonly ApiType[] = []): void {
	codecs.set(codec.api, codec);
	for (const alias of aliases) codecs.set(alias, codec);
}

export function getGenerateMessageCodec(api: ApiType): GenerateMessageCodec | undefined {
	return codecs.get(api);
}

export function getGenerateMessageCodecApis(): ApiType[] {
	return [...codecs.keys()];
}
