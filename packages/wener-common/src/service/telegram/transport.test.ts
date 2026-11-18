import { describe, expect, it } from 'vitest';
import { decodeTelegramDownloadFile, decodeTelegramSendDocument, decodeTelegramSendPhoto, encodeTelegramDownloadFile, encodeTelegramSendDocument, encodeTelegramSendPhoto } from './transport';

describe('Telegram binary transport projection', () => {
	it('round-trips native photo and document uploads', () => {
		const photo = { chatId: 1, photo: { bytes: new Uint8Array([0, 1, 254, 255]), filename: 'photo.jpg', contentType: 'image/jpeg' } };
		expect(decodeTelegramSendPhoto(encodeTelegramSendPhoto(photo))).toEqual(photo);
		const document = { chatId: 1, document: { bytes: new Uint8Array([3, 4, 5]), filename: 'doc.bin' } };
		expect(decodeTelegramSendDocument(encodeTelegramSendDocument(document))).toEqual(document);
	});

	it('round-trips bounded download output and rejects mismatched Base64 lengths', () => {
		const output = { bytes: new Uint8Array([1, 2, 3]), byteLength: 3, filePath: 'docs/a.bin', contentType: 'application/octet-stream' };
		expect(decodeTelegramDownloadFile(encodeTelegramDownloadFile(output))).toEqual(output);
		expect(() => encodeTelegramDownloadFile({ bytes: new Uint8Array([1]), byteLength: 2, filePath: 'docs/a.bin' })).toThrow('Invalid Telegram file response');
		expect(() => decodeTelegramDownloadFile({ base64: 'AQI=', byteLength: 3, filePath: 'docs/a.bin' })).toThrow('Invalid Telegram file response');
	});

	it('round-trips MiB payloads without overflowing the regular expression stack', () => {
		const bytes = new Uint8Array(1024 * 1024).fill(255);
		const wire = encodeTelegramSendDocument({ chatId: 1, document: { bytes, filename: 'large.bin' } });
		const native = decodeTelegramSendDocument(wire);
		expect(typeof native.document).toBe('object');
		if (typeof native.document !== 'string') expect(native.document.bytes).toEqual(bytes);
	});
});
