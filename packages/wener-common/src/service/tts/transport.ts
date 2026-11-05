import type { TtsAudio } from '@wener/client/tts';
import { TTS_MAX_AUDIO_BYTES, type TtsAudioWire, TtsAudioWireSchema } from './input';

/** Browser-safe conversion; no Node Buffer or spread over an entire audio payload. */
export function encodeTtsAudio(audio: TtsAudio): TtsAudioWire {
	if (!(audio.audio instanceof Uint8Array) || !audio.audio.byteLength || audio.audio.byteLength > TTS_MAX_AUDIO_BYTES)
		throw new TypeError('Invalid TTS audio');
	const parts: string[] = [];
	for (let i = 0; i < audio.audio.byteLength; i += 8192)
		parts.push(String.fromCharCode(...audio.audio.subarray(i, i + 8192)));
	const result = TtsAudioWireSchema.safeParse({
		audioBase64: btoa(parts.join('')),
		format: audio.format,
		mediaType: audio.mediaType,
		voice: audio.voice,
		model: audio.model,
		byteLength: audio.audio.byteLength,
	});
	if (!result.success) throw new TypeError('Invalid TTS audio');
	return result.data;
}

export function decodeTtsAudio(input: unknown): TtsAudio {
	const parsed = TtsAudioWireSchema.safeParse(input);
	if (!parsed.success) throw new TypeError('Invalid TTS audio transport');
	try {
		const { audioBase64, byteLength, ...metadata } = parsed.data;
		const binary = atob(audioBase64);
		if (binary.length !== byteLength || btoa(binary) !== audioBase64) throw new Error();
		return { ...metadata, audio: Uint8Array.from(binary, (char) => char.charCodeAt(0)) };
	} catch {
		throw new TypeError('Invalid TTS audio transport');
	}
}
