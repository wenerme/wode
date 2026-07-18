/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vite-plus/test';
import { AgentRuntimeFileError, convertAgentFilesToUIParts } from './file-parts';

describe('convertAgentFilesToUIParts', () => {
	it('converts bounded text, image, audio, and generic files to AI SDK FileUIParts', async () => {
		const parts = await convertAgentFilesToUIParts([
			new File(['text'], 'note.txt', { type: 'text/plain' }),
			new File(['image'], 'image.png', { type: 'image/png' }),
			new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' }),
			new File(['bytes'], 'data.bin', { type: '' }),
		]);
		expect(parts.map((part) => [part.filename, part.mediaType])).toEqual([
			['note.txt', 'text/plain'],
			['image.png', 'image/png'],
			['audio.mp3', 'audio/mpeg'],
			['data.bin', 'application/octet-stream'],
		]);
		for (const part of parts) expect(part.url).toMatch(/^data:/u);
	});

	it('rejects count, item, aggregate, and unsupported types before Data URL allocation', async () => {
		const read = vi.spyOn(FileReader.prototype, 'readAsDataURL');
		try {
			await expect(
				convertAgentFilesToUIParts([sizedFile('one', 1), sizedFile('two', 1)], { maxFiles: 1 }),
			).rejects.toMatchObject({ code: 'file-count' });
			await expect(convertAgentFilesToUIParts([sizedFile('large', 11)], { maxFileSize: 10 })).rejects.toMatchObject({
				code: 'file-size',
			});
			await expect(
				convertAgentFilesToUIParts([sizedFile('one', 6), sizedFile('two', 5)], { maxTotalSize: 10 }),
			).rejects.toMatchObject({ code: 'total-size' });
			await expect(convertAgentFilesToUIParts([sizedFile('clip.mp4', 1, 'video/mp4')])).rejects.toEqual(
				new AgentRuntimeFileError('unsupported-type', 'clip.mp4 的类型不受支持。', expect.any(File)),
			);
			expect(read).not.toHaveBeenCalled();
		} finally {
			read.mockRestore();
		}
	});

	it('cancels file reading through AbortSignal', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			convertAgentFilesToUIParts([new File(['x'], 'note.txt')], {}, controller.signal),
		).rejects.toMatchObject({
			code: 'aborted',
		});
	});
});

function sizedFile(name: string, size: number, type = 'application/octet-stream') {
	const file = new File(['x'], name, { type });
	Object.defineProperty(file, 'size', { configurable: true, value: size });
	return file;
}
