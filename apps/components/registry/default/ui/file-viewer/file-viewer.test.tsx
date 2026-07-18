import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import { FileViewer } from './file-viewer';
import {
	AudioFileViewer,
	ImageFileViewer,
	PdfFileViewer,
	UnsupportedFileViewer,
	VideoFileViewer,
} from './media-file-viewers';
import { isTextFileViewerDirty, TextFileViewer } from './text-file-viewer';

const noop = () => undefined;

describe('file viewer presentation', () => {
	it('dispatches text and exposes controlled editing without hiding dirty state', () => {
		const markup = renderToStaticMarkup(
			<FileViewer
				file={{ name: 'notes.md', mimeType: 'text/markdown' }}
				text='saved'
				draft='changed'
				editing
				onDraftChange={noop}
				onSave={noop}
			/>,
		);
		expect(markup).toContain('data-slot="file-viewer"');
		expect(markup).toContain('data-kind="text"');
		expect(markup).toContain('data-slot="text-file-viewer"');
		expect(markup).toContain('data-dirty="true"');
		expect(markup).toContain('aria-keyshortcuts="Control+S Meta+S"');
		expect(markup).toContain('保存');
		expect(markup).toContain('changed');
	});

	it('renders native, accessible media primitives', () => {
		const image = renderToStaticMarkup(
			<ImageFileViewer file={{ name: 'diagram.png' }} src='https://example.com/diagram.png' />,
		);
		const pdf = renderToStaticMarkup(
			<PdfFileViewer file={{ name: 'manual.pdf' }} src='https://example.com/manual.pdf' />,
		);
		const audio = renderToStaticMarkup(
			<AudioFileViewer file={{ name: 'voice.mp3' }} src='https://example.com/voice.mp3' />,
		);
		const video = renderToStaticMarkup(
			<VideoFileViewer file={{ name: 'demo.mp4' }} src='https://example.com/demo.mp4' />,
		);
		expect(image).toContain('object-contain');
		expect(image).toContain('alt="diagram.png"');
		expect(pdf).toContain('<object');
		expect(pdf).toContain('type="application/pdf"');
		expect(pdf).toContain('当前浏览器无法内嵌预览 PDF');
		expect(audio).toContain('<audio');
		expect(audio).toContain('controls=""');
		expect(video).toContain('<video');
		expect(video).toContain('controls=""');
	});

	it('shows unsupported metadata and an optional download command', () => {
		const onDownload = vi.fn();
		const markup = renderToStaticMarkup(
			<UnsupportedFileViewer
				file={{ name: 'archive.bin', mimeType: 'application/octet-stream', size: 2048 }}
				onDownload={onDownload}
			/>,
		);
		expect(markup).toContain('无法预览此文件');
		expect(markup).toContain('application/octet-stream');
		expect(markup).toContain('2.0 KB');
		expect(markup).toContain('<button');
		expect(markup).toContain('下载文件');
		expect(onDownload).not.toHaveBeenCalled();
	});

	it('renders controlled pending and error states without external notification coupling', () => {
		const markup = renderToStaticMarkup(
			<TextFileViewer
				file={{ name: 'config.txt' }}
				text='saved'
				draft='draft'
				editing
				error='写入被拒绝'
				pending
				onSave={noop}
			/>,
		);
		expect(markup).toContain('role="alert"');
		expect(markup).toContain('写入被拒绝');
		expect(markup).toContain('保存中');
		expect(markup).toContain('aria-busy="true"');
		expect(markup).not.toContain('toast');
	});

	it('keeps save controls absent in read-only mode', () => {
		const markup = renderToStaticMarkup(
			<TextFileViewer file={{ name: 'config.txt' }} text='immutable' readOnly onSave={noop} />,
		);
		expect(markup).toContain('只读');
		expect(markup).toContain('immutable');
		expect(markup).not.toContain('aria-keyshortcuts');
		expect(markup).not.toContain('保存</button>');
		expect(isTextFileViewerDirty('a', 'a')).toBe(false);
		expect(isTextFileViewerDirty('a', 'b')).toBe(true);
	});

	it('allows every text editing accessibility label to be localized', () => {
		const file = { name: 'config.txt' };
		const messages = {
			editingActionsLabel: () => 'Custom toolbar',
			editFileLabel: () => 'Custom edit',
			editorLabel: () => 'Custom editor',
		};
		const readMarkup = renderToStaticMarkup(
			<TextFileViewer file={file} messages={messages} text='saved' onSave={noop} />,
		);
		const editMarkup = renderToStaticMarkup(
			<TextFileViewer file={file} messages={messages} text='saved' draft='changed' editing onSave={noop} />,
		);
		expect(readMarkup).toContain('aria-label="Custom edit"');
		expect(editMarkup).toContain('aria-label="Custom toolbar"');
		expect(editMarkup).toContain('aria-label="Custom editor"');
	});
});
