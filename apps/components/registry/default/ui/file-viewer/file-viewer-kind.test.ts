import { describe, expect, it } from 'vite-plus/test';
import {
	getFileSystemViewerExtension,
	getFileViewerExtension,
	getFileViewerMimeType,
	normalizeFileViewerMimeType,
	resolveFileSystemViewerKind,
	resolveFileViewerKind,
} from './file-viewer-kind';

describe('file viewer kind resolver', () => {
	it.each([
		['REPORT.JSON?download=1#page', undefined, 'text'],
		['photo.JpEg?size=large', undefined, 'image'],
		['manual.PDF#page=2', undefined, 'pdf'],
		['recording.MP3?token=redacted', undefined, 'audio'],
		['clip.WeBm#time=2', undefined, 'video'],
		['README', 'Text/Plain; Charset=UTF-8', 'text'],
		['payload.bin', 'application/problem+json; charset=utf-8', 'text'],
		['asset.bin', 'IMAGE/PNG; charset=binary', 'image'],
		['unknown.dat', 'application/octet-stream', 'unsupported'],
	] as const)('resolves %s with %s as %s', (name, mimeType, kind) => {
		expect(resolveFileViewerKind({ name, mimeType })).toBe(kind);
	});

	it('normalizes extension and MIME input without trusting query text', () => {
		expect(getFileViewerExtension('C:\\Temp\\NOTES.MD?as=.pdf')).toBe('md');
		expect(normalizeFileViewerMimeType(' Application/PDF ; version=1.7 ')).toBe('application/pdf');
		expect(getFileViewerMimeType({ name: 'archive.JSONL' })).toBe('application/x-ndjson');
		expect(getFileViewerMimeType({ name: 'photo.webp' })).toBe('image/webp');
	});

	it('uses a recognized MIME type before a misleading extension', () => {
		expect(resolveFileViewerKind({ name: 'report.pdf', mimeType: 'text/plain' })).toBe('text');
		expect(resolveFileViewerKind({ name: 'notes.txt', mimeType: 'video/mp4' })).toBe('video');
	});

	it('keeps question marks and hashes in raw filesystem basenames', () => {
		expect(getFileSystemViewerExtension('/workspace/report?.txt')).toBe('txt');
		expect(getFileSystemViewerExtension('/workspace/report#.txt')).toBe('txt');
		expect(resolveFileSystemViewerKind({ name: 'report?.txt', path: '/workspace/report?.txt' })).toBe('text');
		expect(resolveFileSystemViewerKind({ name: 'clip#final.mp4', path: '/workspace/clip#final.mp4' })).toBe('video');
	});
});
