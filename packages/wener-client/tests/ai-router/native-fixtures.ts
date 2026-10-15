import assert from 'node:assert/strict';
import { deflateSync, inflateSync } from 'node:zlib';

export type JsonObject = Record<string, unknown>;

export function object(value: unknown): JsonObject {
	assert(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected JSON object');
	return value as JsonObject;
}

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
	const chunk = Buffer.alloc(data.length + 12);
	chunk.writeUInt32BE(data.length);
	chunk.write(type, 4, 'ascii');
	data.copy(chunk, 8);
	chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
	return chunk;
}

/** 有完整 CRC、IHDR、IDAT 和 IEND 的本地 RGB PNG，不依赖外部图片服务。 */
export function makeTestPng(size = 256): Buffer {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	const pixels = Buffer.alloc(size * (1 + size * 3));
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const offset = y * (1 + size * 3) + 1 + x * 3;
			const square = x > size / 4 && x < (size * 3) / 4 && y > size / 4 && y < (size * 3) / 4;
			pixels.set(square ? [220, 30, 30] : [245, 245, 245], offset);
		}
	}
	return Buffer.concat([
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
		pngChunk('IHDR', ihdr),
		pngChunk('IDAT', deflateSync(pixels)),
		pngChunk('IEND', Buffer.alloc(0)),
	]);
}

/** 校验 PNG 容器、每个 chunk 的 CRC 和实际解压后的像素行，拒绝仅有魔数的伪图像。 */
export function assertPng(bytes: Uint8Array): { width: number; height: number } {
	const buffer = Buffer.from(bytes);
	assert(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Expected PNG signature');
	const chunks: Buffer[] = [];
	let width = 0;
	let height = 0;
	let channels = 0;
	let ended = false;
	for (let offset = 8; offset + 12 <= buffer.length; ) {
		const size = buffer.readUInt32BE(offset);
		assert(offset + size + 12 <= buffer.length, 'Truncated PNG chunk');
		const type = buffer.toString('ascii', offset + 4, offset + 8);
		const data = buffer.subarray(offset + 8, offset + 8 + size);
		assert.equal(
			crc32(buffer.subarray(offset + 4, offset + 8 + size)),
			buffer.readUInt32BE(offset + 8 + size),
			'PNG CRC mismatch',
		);
		if (type === 'IHDR') {
			assert.equal(size, 13);
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			assert(width > 0 && height > 0 && width <= 8192 && height <= 8192);
			assert.equal(data[8], 8, 'Expected 8-bit PNG');
			channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[data[9]];
			assert(channels, 'Expected grayscale/RGB/RGBA PNG');
			assert.equal(data[12], 0, 'Expected non-interlaced PNG');
		}
		if (type === 'IDAT') chunks.push(data);
		if (type === 'IEND') {
			assert.equal(offset + size + 12, buffer.length);
			ended = true;
		}
		offset += size + 12;
	}
	assert(ended && chunks.length && channels, 'Incomplete PNG');
	const stride = width * channels + 1;
	const pixels = inflateSync(Buffer.concat(chunks), { maxOutputLength: height * stride });
	assert.equal(pixels.length, height * stride);
	for (let y = 0; y < height; y++) assert(pixels[y * stride] <= 4, 'Invalid PNG row filter');
	return { width, height };
}

export function assertWav(bytes: Uint8Array): { sampleRate: number; dataBytes: number } {
	const buffer = Buffer.from(bytes);
	assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', 'Expected WAV RIFF header');
	assert.equal(buffer.toString('ascii', 8, 12), 'WAVE');
	let sampleRate = 0;
	let dataBytes = 0;
	for (let offset = 12; offset + 8 <= buffer.length; ) {
		const type = buffer.toString('ascii', offset, offset + 4);
		const size = buffer.readUInt32LE(offset + 4);
		assert(offset + 8 + size <= buffer.length, 'Truncated WAV chunk');
		if (type === 'fmt ') {
			assert(size >= 16);
			sampleRate = buffer.readUInt32LE(offset + 12);
			assert(sampleRate >= 8000);
			assert(buffer.readUInt16LE(offset + 10) > 0, 'WAV has no channels');
		}
		if (type === 'data') {
			dataBytes += size;
			assert(
				buffer.subarray(offset + 8, offset + 8 + size).some((byte) => byte !== 0),
				'WAV contains only silence',
			);
		}
		offset += 8 + size + (size % 2);
	}
	assert(sampleRate > 0 && dataBytes > 1000, 'WAV must contain an audio payload');
	return { sampleRate, dataBytes };
}

export function assertEmbeddings(value: unknown, count: number): number[][] {
	const data = object(value).data;
	assert(Array.isArray(data));
	assert.equal(data.length, count);
	const embeddings = data.map((item, index) => {
		const entry = object(item);
		assert.equal(entry.index, index);
		assert(Array.isArray(entry.embedding) && entry.embedding.length > 0);
		assert(entry.embedding.every((number: unknown) => typeof number === 'number' && Number.isFinite(number)));
		assert(entry.embedding.some((number: number) => number !== 0));
		return entry.embedding as number[];
	});
	assert(embeddings.every((embedding) => embedding.length === embeddings[0].length));
	return embeddings;
}

/** 避免错误响应回显请求中的密钥或大段媒体 base64。 */
export function errorSummary(text: string, secret?: string): string {
	return (secret ? text.split(secret).join('[REDACTED]') : text)
		.replace(/[A-Za-z0-9+/=_-]{160,}/g, '[MEDIA_OR_TOKEN]')
		.slice(0, 800);
}
