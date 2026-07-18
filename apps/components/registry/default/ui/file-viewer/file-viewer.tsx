'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getFileViewerMimeType, resolveFileViewerKind } from './file-viewer-kind';
import type {
	FileViewerBytes,
	FileViewerFileDescriptor,
	FileViewerKind,
	FileViewerMessages,
} from './file-viewer-types';
import { mergeFileViewerMessages } from './file-viewer-types';
import {
	AudioFileViewer,
	ImageFileViewer,
	PdfFileViewer,
	UnsupportedFileViewer,
	VideoFileViewer,
} from './media-file-viewers';
import { TextFileViewer } from './text-file-viewer';
import { copyFileViewerBytes, useFileViewerObjectUrl } from './use-file-viewer-object-url';

export type FileViewerProps = Omit<ComponentPropsWithRef<'section'>, 'children' | 'onChange'> & {
	file: FileViewerFileDescriptor;
	bytes?: FileViewerBytes;
	downloadHref?: string;
	draft?: string;
	editing?: boolean;
	kind?: FileViewerKind;
	messages?: Partial<FileViewerMessages>;
	onDownload?: (file: FileViewerFileDescriptor) => void;
	onDraftChange?: (draft: string) => void;
	onEditingChange?: (editing: boolean) => void;
	onSave?: (draft: string) => Promise<void> | void;
	pending?: boolean;
	readOnly?: boolean;
	saveError?: ReactNode;
	showTextHeader?: boolean;
	src?: string;
	text?: string;
};

export function FileViewer({
	bytes,
	className,
	downloadHref,
	draft,
	editing,
	file,
	kind: kindOverride,
	messages: messageOverrides,
	onDownload,
	onDraftChange,
	onEditingChange,
	onSave,
	pending,
	readOnly,
	saveError,
	showTextHeader,
	src,
	text,
	...props
}: FileViewerProps) {
	const kind = kindOverride ?? resolveFileViewerKind(file);
	const mimeType = getFileViewerMimeType(file, kind);
	const messages = mergeFileViewerMessages(messageOverrides);
	const decodedText = useMemo(
		() =>
			text === undefined && bytes && kind === 'text' ? new TextDecoder().decode(copyFileViewerBytes(bytes)) : text,
		[bytes, kind, text],
	);
	const ownedUrl = useFileViewerObjectUrl(
		!src && kind !== 'text' && kind !== 'unsupported' ? bytes : undefined,
		mimeType,
	);
	const mediaSource = src ?? ownedUrl;
	let content: ReactNode;

	if (kind === 'text' && decodedText !== undefined) {
		content = (
			<TextFileViewer
				file={file}
				text={decodedText}
				draft={draft}
				editing={editing}
				error={saveError}
				messages={messages}
				onDraftChange={onDraftChange}
				onEditingChange={onEditingChange}
				onSave={onSave}
				pending={pending}
				readOnly={readOnly}
				showHeader={showTextHeader}
			/>
		);
	} else if (kind === 'image' && mediaSource) {
		content = (
			<ImageFileViewer
				downloadHref={downloadHref ?? mediaSource}
				file={file}
				messages={messages}
				onDownload={onDownload}
				src={mediaSource}
			/>
		);
	} else if (kind === 'pdf' && mediaSource) {
		content = (
			<PdfFileViewer
				downloadHref={downloadHref ?? mediaSource}
				file={file}
				messages={messages}
				onDownload={onDownload}
				src={mediaSource}
			/>
		);
	} else if (kind === 'audio' && mediaSource) {
		content = (
			<AudioFileViewer
				downloadHref={downloadHref ?? mediaSource}
				file={file}
				messages={messages}
				onDownload={onDownload}
				src={mediaSource}
			/>
		);
	} else if (kind === 'video' && mediaSource) {
		content = (
			<VideoFileViewer
				downloadHref={downloadHref ?? mediaSource}
				file={file}
				messages={messages}
				onDownload={onDownload}
				src={mediaSource}
			/>
		);
	} else if (kind === 'unsupported') {
		content = (
			<UnsupportedFileViewer file={file} downloadHref={downloadHref} messages={messages} onDownload={onDownload} />
		);
	} else if (bytes) {
		content = (
			<div role='status' className='text-base-content/60 grid min-h-64 place-items-center p-5 text-center text-sm'>
				{messages.loading}
			</div>
		);
	} else {
		content = (
			<div role='status' className='text-base-content/60 grid min-h-64 place-items-center p-5 text-center text-sm'>
				{messages.missingSource}
			</div>
		);
	}

	return (
		<section
			data-slot='file-viewer'
			data-kind={kind}
			className={cn('bg-base-100 min-h-0 min-w-0 overflow-hidden', className)}
			{...props}
		>
			{content}
		</section>
	);
}
