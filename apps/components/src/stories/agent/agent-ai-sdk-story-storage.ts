import type { OpenAICompatibleConnectionDraft } from '@/agent/agent-ai-sdk';

export const LIVE_OPENAI_CONNECTION_STORAGE_KEY = 'wode:storybook:agent-ai-sdk-direct-chat:connection:v2';

export type LiveOpenAIConnectionStoryState = {
	connection: OpenAICompatibleConnectionDraft;
	rememberCredentials: boolean;
};

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

const MAX_STORED_BYTES = 128 * 1024;
const blankConnection: OpenAICompatibleConnectionDraft = { apiKey: '', baseUrl: '', headers: {}, model: '' };

export function resolveLiveOpenAIConnectionStoryState(
	storage: StorageReader | undefined,
	environmentConnection: OpenAICompatibleConnectionDraft | undefined,
): LiveOpenAIConnectionStoryState {
	if (!environmentConnection) return readLiveOpenAIConnectionStoryState(storage);
	return {
		connection: {
			...environmentConnection,
			headers: environmentConnection.headers ? { ...environmentConnection.headers } : {},
		},
		rememberCredentials: false,
	};
}

export function readLiveOpenAIConnectionStoryState(storage?: StorageReader): LiveOpenAIConnectionStoryState {
	if (!storage) return createBlankState();
	try {
		const raw = storage.getItem(LIVE_OPENAI_CONNECTION_STORAGE_KEY);
		if (!raw || raw.length > MAX_STORED_BYTES) return createBlankState();
		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed) || parsed.version !== 2) return createBlankState();
		const rememberCredentials = parsed.rememberCredentials === true;
		const connection = parseStoredConnection(parsed.connection, rememberCredentials);
		return connection ? { connection, rememberCredentials } : createBlankState();
	} catch {
		return createBlankState();
	}
}

export function writeLiveOpenAIConnectionStoryState(
	storage: StorageWriter | undefined,
	connection: OpenAICompatibleConnectionDraft,
	rememberCredentials: boolean,
): boolean {
	if (!storage) return false;
	try {
		const sanitized = parseStoredConnection(connection, rememberCredentials);
		if (!sanitized) return false;
		const storedConnection: Record<string, unknown> = {
			baseUrl: sanitized.baseUrl,
			model: sanitized.model,
		};
		if (rememberCredentials) {
			storedConnection.apiKey = sanitized.apiKey ?? '';
			storedConnection.headers = sanitized.headers ?? {};
		}
		const raw = JSON.stringify({ version: 2, rememberCredentials, connection: storedConnection });
		if (raw.length > MAX_STORED_BYTES) return false;
		storage.setItem(LIVE_OPENAI_CONNECTION_STORAGE_KEY, raw);
		return true;
	} catch {
		return false;
	}
}

function parseStoredConnection(
	value: unknown,
	includeCredentials: boolean,
): OpenAICompatibleConnectionDraft | undefined {
	if (!isRecord(value)) return undefined;
	const baseUrl = boundedString(value.baseUrl, 2_048);
	const model = boundedString(value.model, 256);
	if (baseUrl === undefined || model === undefined) return undefined;
	if (!includeCredentials) return { apiKey: '', baseUrl, headers: {}, model };
	const apiKey = value.apiKey === undefined ? '' : boundedString(value.apiKey, 16 * 1024);
	const headers = parseHeaders(value.headers);
	if (apiKey === undefined || headers === undefined) return undefined;
	return { apiKey, baseUrl, headers, model };
}

function parseHeaders(value: unknown): Record<string, string> | undefined {
	const headers = Object.create(null) as Record<string, string>;
	if (value === undefined) return headers;
	if (!isRecord(value)) return undefined;
	const entries = Object.entries(value);
	if (entries.length > 64) return undefined;
	for (const [name, entryValue] of entries) {
		if (!name || name.length > 128 || typeof entryValue !== 'string' || entryValue.length > 8 * 1024) return undefined;
		if (/\r|\n/u.test(name) || /\r|\n/u.test(entryValue)) return undefined;
		Object.defineProperty(headers, name, {
			configurable: true,
			enumerable: true,
			value: entryValue,
			writable: true,
		});
	}
	return headers;
}

function boundedString(value: unknown, maxLength: number): string | undefined {
	return typeof value === 'string' && value.length <= maxLength ? value : undefined;
}

function isRecord(value: unknown): value is Readonly<Record<PropertyKey, unknown>> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createBlankState(): LiveOpenAIConnectionStoryState {
	return { connection: { ...blankConnection, headers: {} }, rememberCredentials: false };
}
