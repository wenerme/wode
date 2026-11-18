import { ArrayBuffers } from '@wener/utils';
import { z } from 'zod';
import {
	TelegramDownloadFileOutputSchema, TelegramDownloadFileWireOutputSchema, TelegramSendDocumentInputSchema,
	TelegramSendDocumentWireInputSchema, TelegramSendPhotoInputSchema, TelegramSendPhotoWireInputSchema,
	type TelegramDownloadFileOutput, type TelegramSendDocumentInput, type TelegramSendPhotoInput,
} from './TelegramServiceContract';

export function encodeTelegramBase64(bytes: Uint8Array): string {
	return ArrayBuffers.toString(bytes, 'base64');
}

export function decodeTelegramBase64(value: string, byteLength: number): Uint8Array {
	if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(value)) throw new TypeError('Invalid Telegram Base64 content');
	const bytes = ArrayBuffers.fromBase64(value);
	if (bytes.byteLength !== byteLength || ArrayBuffers.toString(bytes, 'base64') !== value) throw new TypeError('Invalid Telegram Base64 content');
	return bytes;
}

export function encodeTelegramSendPhoto(input: TelegramSendPhotoInput): z.output<typeof TelegramSendPhotoWireInputSchema> {
	const parsed = TelegramSendPhotoInputSchema.safeParse(input);
	if (!parsed.success) throw new TypeError('Invalid Telegram photo input');
	const { photo, ...rest } = parsed.data;
	const wirePhoto = typeof photo === 'string' ? photo : { base64: encodeTelegramBase64(photo.bytes), byteLength: photo.bytes.byteLength, filename: photo.filename, ...(photo.contentType === undefined ? {} : { contentType: photo.contentType }) };
	const wire = TelegramSendPhotoWireInputSchema.safeParse({ ...rest, photo: wirePhoto });
	if (!wire.success) throw new TypeError('Invalid Telegram photo input');
	return wire.data;
}

export function decodeTelegramSendPhoto(input: unknown): TelegramSendPhotoInput {
	const wire = TelegramSendPhotoWireInputSchema.safeParse(input);
	if (!wire.success) throw new TypeError('Invalid Telegram photo input');
	const { photo, ...rest } = wire.data;
	if (typeof photo === 'string') return { ...rest, photo };
	try {
		return { ...rest, photo: { bytes: decodeTelegramBase64(photo.base64, photo.byteLength), filename: photo.filename, ...(photo.contentType === undefined ? {} : { contentType: photo.contentType }) } };
	} catch {
		throw new TypeError('Invalid Telegram photo input');
	}
}

export function encodeTelegramSendDocument(input: TelegramSendDocumentInput): z.output<typeof TelegramSendDocumentWireInputSchema> {
	const parsed = TelegramSendDocumentInputSchema.safeParse(input);
	if (!parsed.success) throw new TypeError('Invalid Telegram document input');
	const { document, ...rest } = parsed.data;
	const wireDocument = typeof document === 'string' ? document : { base64: encodeTelegramBase64(document.bytes), byteLength: document.bytes.byteLength, filename: document.filename, ...(document.contentType === undefined ? {} : { contentType: document.contentType }) };
	const wire = TelegramSendDocumentWireInputSchema.safeParse({ ...rest, document: wireDocument });
	if (!wire.success) throw new TypeError('Invalid Telegram document input');
	return wire.data;
}

export function decodeTelegramSendDocument(input: unknown): TelegramSendDocumentInput {
	const wire = TelegramSendDocumentWireInputSchema.safeParse(input);
	if (!wire.success) throw new TypeError('Invalid Telegram document input');
	const { document, ...rest } = wire.data;
	if (typeof document === 'string') return { ...rest, document };
	try {
		return { ...rest, document: { bytes: decodeTelegramBase64(document.base64, document.byteLength), filename: document.filename, ...(document.contentType === undefined ? {} : { contentType: document.contentType }) } };
	} catch {
		throw new TypeError('Invalid Telegram document input');
	}
}

export function encodeTelegramDownloadFile(output: TelegramDownloadFileOutput): z.output<typeof TelegramDownloadFileWireOutputSchema> {
	const parsed = TelegramDownloadFileOutputSchema.safeParse(output);
	if (!parsed.success) throw new TypeError('Invalid Telegram file response');
	const wire = TelegramDownloadFileWireOutputSchema.safeParse({
		base64: encodeTelegramBase64(parsed.data.bytes), byteLength: parsed.data.byteLength, filePath: parsed.data.filePath,
		...(parsed.data.contentType === undefined ? {} : { contentType: parsed.data.contentType }),
	});
	if (!wire.success) throw new TypeError('Invalid Telegram file response');
	return wire.data;
}

export function decodeTelegramDownloadFile(input: unknown): TelegramDownloadFileOutput {
	const parsed = TelegramDownloadFileWireOutputSchema.safeParse(input);
	if (!parsed.success) throw new TypeError('Invalid Telegram file response');
	try {
		return {
			bytes: decodeTelegramBase64(parsed.data.base64, parsed.data.byteLength), byteLength: parsed.data.byteLength,
			filePath: parsed.data.filePath, ...(parsed.data.contentType === undefined ? {} : { contentType: parsed.data.contentType }),
		};
	} catch {
		throw new TypeError('Invalid Telegram file response');
	}
}
