'use client';

import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useMemo } from 'react';
import type {
	FileManagerFileTypeDefinition,
	FileManagerRegistry,
} from '@components/file-type-registry/file-manager-file-type-types';
import {
	getBuiltinFileManagerFileType,
	renderFileManagerFileType,
	useFileManagerRegistry,
} from './file-manager-registry';
import { cn } from '@/lib/utils';
import {
	getFileTypeMimeType,
	getFileViewerMimeType,
	resolveFileViewerType,
	toFileViewerKind,
} from './file-viewer-kind';
import type {
	FileViewerBytes,
	FileViewerFileDescriptor,
	FileViewerKind,
	FileViewerMessages,
} from './file-viewer-types';
import { mergeFileViewerMessages } from './file-viewer-types';
import { UnsupportedFileViewer } from './media-file-viewers';
import { copyFileViewerBytes, useFileViewerObjectUrl } from './use-file-viewer-object-url';

export type FileViewerProps = Omit<ComponentPropsWithRef<'section'>, 'children' | 'onChange'> & {
	file: FileViewerFileDescriptor;
	fileType?: FileManagerFileTypeDefinition;
	bytes?: FileViewerBytes;
	downloadHref?: string;
	draft?: string;
	editing?: boolean;
	kind?: FileViewerKind;
	manager?: FileManagerRegistry;
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
	fileType: fileTypeOverride,
	kind: kindOverride,
	manager: managerOverride,
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
	const manager = useFileManagerRegistry(managerOverride);
	const resolvedFileType = fileTypeOverride ?? resolveFileViewerType(file, manager);
	const fileType =
		kindOverride && !fileTypeOverride
			? toFileViewerKind(resolvedFileType) === kindOverride
				? resolvedFileType
				: (getBuiltinFileManagerFileType(getBuiltinFileTypeId(kindOverride)) ?? resolvedFileType)
			: resolvedFileType;
	const kind = fileTypeOverride ? toFileViewerKind(fileTypeOverride) : (kindOverride ?? toFileViewerKind(fileType));
	const mimeType = fileTypeOverride
		? getFileTypeMimeType(file, fileTypeOverride, kind, manager)
		: getFileViewerMimeType(file, kind, manager);
	const messages = mergeFileViewerMessages(messageOverrides);
	const decodedText = useMemo(
		() =>
			text === undefined && bytes && kind === 'text' ? new TextDecoder().decode(copyFileViewerBytes(bytes)) : text,
		[bytes, kind, text],
	);
	const shouldCreateUrl = !src && kind !== 'text' && Boolean(fileType?.viewer || fileType?.editor);
	const ownedUrl = useFileViewerObjectUrl(shouldCreateUrl ? bytes : undefined, mimeType);
	const mediaSource = src ?? ownedUrl;
	const renderer = editing && fileType?.editor ? fileType.editor : fileType?.viewer;
	const hasRequiredContent =
		kind === 'text'
			? decodedText !== undefined
			: kind === 'image' || kind === 'pdf' || kind === 'audio' || kind === 'video'
				? Boolean(mediaSource)
				: true;
	let content: ReactNode;

	if (renderer && hasRequiredContent && fileType) {
		content = renderFileManagerFileType(renderer, {
			bytes,
			downloadHref,
			draft,
			editing,
			file,
			fileType,
			messages,
			onDownload,
			onDraftChange,
			onEditingChange,
			onSave,
			pending,
			readOnly,
			saveError,
			showTextHeader,
			src: mediaSource,
			text: decodedText,
		});
	} else if (!renderer || kind === 'unsupported') {
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
			data-file-type={fileType?.id}
			data-kind={kind}
			className={cn('bg-base-100 min-h-0 min-w-0 overflow-hidden', className)}
			{...props}
		>
			{content}
		</section>
	);
}

function getBuiltinFileTypeId(kind: FileViewerKind): string {
	return kind === 'unsupported' ? 'generic-file' : kind;
}
