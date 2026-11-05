export type TtsAudioFormat = 'mp3' | 'wav' | 'opus' | 'aac' | 'flac' | 'pcm';

export interface TtsRequest {
	text: string;
	voice?: string;
	format?: TtsAudioFormat;
	model?: string;
	speed?: number;
	rate?: string;
	pitch?: string;
	volume?: string;
	instructions?: string;
}

export interface TtsAudio {
	audio: Uint8Array;
	format: TtsAudioFormat;
	mediaType: string;
	voice?: string;
	model?: string;
}

export interface TtsVoice {
	id: string;
	name?: string;
	locale?: string;
	gender?: string;
}

export interface TtsVoiceQuery {
	locale?: string;
	query?: string;
}

export interface TtsVoiceList {
	supported: boolean;
	voices: TtsVoice[];
}

export interface TtsCallOptions {
	signal?: AbortSignal;
}

export interface TtsClient {
	synthesize(input: TtsRequest, options?: TtsCallOptions): Promise<TtsAudio>;
	listVoices(input?: TtsVoiceQuery, options?: TtsCallOptions): Promise<TtsVoiceList>;
	close(): Promise<void>;
}

/** The adapter delivers ordered text frames or binary frames without transport-specific objects. */
export interface EdgeTtsSocket {
	readonly readyState: number;
	send(data: string): void;
	close(): Promise<void>;
	onOpen(listener: () => void): () => void;
	onMessage(listener: (data: string | Uint8Array) => void): () => void;
	onError(listener: (error?: { status?: number; date?: string }) => void): () => void;
	onClose(listener: () => void): () => void;
}

export type EdgeTtsSocketFactory = (
	url: string,
	options: { headers: Readonly<Record<string, string>> },
) => EdgeTtsSocket;

export const TTS_MAX_AUDIO_BYTES = 16 * 1024 * 1024;
export const TTS_MAX_TEXT_BYTES = 100_000;
export const TTS_MEDIA_TYPES: Record<TtsAudioFormat, string> = {
	mp3: 'audio/mpeg', wav: 'audio/wav', opus: 'audio/ogg', aac: 'audio/aac', flac: 'audio/flac', pcm: 'audio/pcm',
};
