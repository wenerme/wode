'use client';

import type {
	FileManagerFileTypeDefinition,
	FileManagerFileTypeIconProps,
	FileManagerFileTypeMatchInput,
	FileManagerFileTypeViewerProps,
} from '@components/file-type-registry/file-manager-file-type-types';
import { setFileManagerBuiltinDefinitions } from '@components/file-type-registry/file-manager-registry';
import {
	CaseSensitive,
	Database,
	File,
	FileArchive,
	FileAudio,
	FileCode2,
	FileImage,
	FileText,
	FileType2,
	FileVideo,
	Folder,
	Presentation,
	Sheet,
	SquareTerminal,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { AudioFileViewer, ImageFileViewer, PdfFileViewer, VideoFileViewer } from './media-file-viewers';
import { TextFileViewer } from './text-file-viewer';

const textMimeTypes: Readonly<Record<string, string>> = {
	conf: 'text/plain',
	env: 'text/plain',
	ini: 'text/plain',
	log: 'text/plain',
	md: 'text/markdown',
	mdx: 'text/markdown',
	properties: 'text/plain',
	txt: 'text/plain',
};

const codeMimeTypes: Readonly<Record<string, string>> = {
	css: 'text/css',
	csv: 'text/csv',
	html: 'text/html',
	js: 'text/javascript',
	json: 'application/json',
	jsonl: 'application/x-ndjson',
	svg: 'image/svg+xml',
	tsv: 'text/tab-separated-values',
	xml: 'application/xml',
	yaml: 'application/yaml',
	yml: 'application/yaml',
};

const imageMimeTypes: Readonly<Record<string, string>> = {
	avif: 'image/avif',
	bmp: 'image/bmp',
	gif: 'image/gif',
	heic: 'image/heic',
	ico: 'image/x-icon',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	png: 'image/png',
	svg: 'image/svg+xml',
	tif: 'image/tiff',
	tiff: 'image/tiff',
	webp: 'image/webp',
};

const audioMimeTypes: Readonly<Record<string, string>> = {
	aac: 'audio/aac',
	flac: 'audio/flac',
	m4a: 'audio/mp4',
	mp3: 'audio/mpeg',
	oga: 'audio/ogg',
	ogg: 'audio/ogg',
	opus: 'audio/ogg',
	wav: 'audio/wav',
	weba: 'audio/webm',
};

const videoMimeTypes: Readonly<Record<string, string>> = {
	avi: 'video/x-msvideo',
	m4v: 'video/mp4',
	mkv: 'video/x-matroska',
	mov: 'video/quicktime',
	mp4: 'video/mp4',
	mpeg: 'video/mpeg',
	mpg: 'video/mpeg',
	ogv: 'video/ogg',
	webm: 'video/webm',
};

const TextIcon = createFileTypeIcon(FileText, 'text-primary');
const CodeIcon = createFileTypeIcon(FileCode2, 'text-info');
const ImageIcon = createFileTypeIcon(FileImage, 'text-info');
const PdfIcon = createFileTypeIcon(FileType2, 'text-error');
const AudioIcon = createFileTypeIcon(FileAudio, 'text-secondary');
const VideoIcon = createFileTypeIcon(FileVideo, 'text-accent');
const ArchiveIcon = createFileTypeIcon(FileArchive, 'text-warning');
const SheetIcon = createFileTypeIcon(Sheet, 'text-success');
const DocumentIcon = createFileTypeIcon(FileText, 'text-primary');
const SlideIcon = createFileTypeIcon(Presentation, 'text-warning');
const DatabaseIcon = createFileTypeIcon(Database, 'text-secondary');
const FontIcon = createFileTypeIcon(CaseSensitive, 'text-info');
const ExecutableIcon = createFileTypeIcon(SquareTerminal, 'text-base-content');
const GenericIcon = createFileTypeIcon(File, 'text-base-content/50');
const DirectoryIcon = createFileTypeIcon(Folder, 'text-warning');

export const builtinFileManagerFileTypes: readonly FileManagerFileTypeDefinition[] = [
	{
		id: 'generic-file',
		label: '文件',
		priority: -1000,
		match: { predicate: (file) => file.kind !== 'directory' },
		icon: GenericIcon,
		mimeType: 'application/octet-stream',
		viewerKind: 'unsupported',
	},
	{
		id: 'text',
		label: '文本',
		priority: 100,
		match: {
			extensions: Object.keys(textMimeTypes),
			mimeTypes: ['application/rtf'],
			mimeWildcards: ['text/*'],
		},
		icon: TextIcon,
		mimeType: mimeTypeFrom(textMimeTypes, 'text/plain'),
		viewer: { component: TextFileTypeViewer },
		editor: { component: TextFileTypeViewer },
		viewerKind: 'text',
	},
	{
		id: 'code',
		label: '代码',
		priority: 110,
		match: {
			extensions: [
				'c',
				'cc',
				'cpp',
				'cs',
				'css',
				'csv',
				'go',
				'h',
				'hpp',
				'htm',
				'html',
				'java',
				'js',
				'json',
				'jsonl',
				'jsx',
				'py',
				'rs',
				'sh',
				'sql',
				'svg',
				'toml',
				'ts',
				'tsv',
				'tsx',
				'vue',
				'xml',
				'yaml',
				'yml',
			],
			mimeTypes: ['application/json', 'application/xml', 'application/yaml', 'application/x-ndjson'],
			mimeWildcards: ['application/*+json', 'application/*+xml'],
		},
		icon: CodeIcon,
		mimeType: mimeTypeFrom(codeMimeTypes, 'text/plain'),
		viewer: { component: TextFileTypeViewer },
		editor: { component: TextFileTypeViewer },
		viewerKind: 'text',
	},
	{
		id: 'document',
		label: '文档',
		priority: 100,
		match: {
			extensions: ['doc', 'docx', 'odt', 'pages', 'rtf'],
			mimeTypes: ['application/msword', 'application/rtf', 'application/vnd.oasis.opendocument.text'],
			mimeWildcards: ['application/vnd.openxmlformats-officedocument.wordprocessingml.*'],
		},
		icon: DocumentIcon,
	},
	{
		id: 'sheet',
		label: '表格',
		priority: 100,
		match: {
			extensions: ['numbers', 'ods', 'xls', 'xlsb', 'xlsm', 'xlsx'],
			mimeTypes: ['application/vnd.ms-excel', 'application/vnd.oasis.opendocument.spreadsheet'],
			mimeWildcards: ['application/vnd.openxmlformats-officedocument.spreadsheetml.*'],
		},
		icon: SheetIcon,
	},
	{
		id: 'slide',
		label: '演示文稿',
		priority: 100,
		match: {
			extensions: ['key', 'odp', 'pps', 'ppsx', 'ppt', 'pptx'],
			mimeTypes: ['application/vnd.ms-powerpoint', 'application/vnd.oasis.opendocument.presentation'],
			mimeWildcards: ['application/vnd.openxmlformats-officedocument.presentationml.*'],
		},
		icon: SlideIcon,
	},
	{
		id: 'database',
		label: '数据库',
		priority: 100,
		match: {
			extensions: ['accdb', 'db', 'duckdb', 'mdb', 'parquet', 'sqlite', 'sqlite3'],
			mimeTypes: ['application/vnd.apache.parquet', 'application/vnd.sqlite3'],
		},
		icon: DatabaseIcon,
	},
	{
		id: 'font',
		label: '字体',
		priority: 100,
		match: {
			extensions: ['eot', 'otf', 'ttf', 'woff', 'woff2'],
			mimeWildcards: ['font/*'],
		},
		icon: FontIcon,
	},
	{
		id: 'executable',
		label: '可执行文件',
		priority: 100,
		match: {
			extensions: ['apk', 'app', 'bat', 'bin', 'cmd', 'com', 'deb', 'dmg', 'exe', 'msi', 'ps1', 'rpm'],
			mimeTypes: ['application/vnd.android.package-archive', 'application/x-executable'],
		},
		icon: ExecutableIcon,
	},
	{
		id: 'archive',
		label: '压缩包',
		priority: 100,
		match: {
			extensions: ['7z', 'bz2', 'gz', 'rar', 'tar', 'tgz', 'txz', 'xz', 'zip', 'zst'],
			mimeTypes: ['application/gzip', 'application/vnd.rar', 'application/x-7z-compressed', 'application/zip'],
			mimeWildcards: ['application/x-*compressed', 'application/x-tar'],
		},
		icon: ArchiveIcon,
	},
	{
		id: 'pdf',
		label: 'PDF 文档',
		priority: 100,
		match: { extensions: ['pdf'], mimeTypes: ['application/pdf'] },
		icon: PdfIcon,
		mimeType: 'application/pdf',
		viewer: { component: PdfFileTypeViewer },
		viewerKind: 'pdf',
	},
	{
		id: 'image',
		label: '图片',
		priority: 100,
		match: { extensions: [...Object.keys(imageMimeTypes), 'psd'], mimeWildcards: ['image/*'] },
		icon: ImageIcon,
		mimeType: mimeTypeFrom(imageMimeTypes, 'image/*'),
		viewer: { component: ImageFileTypeViewer },
		viewerKind: 'image',
	},
	{
		id: 'audio',
		label: '音频',
		priority: 100,
		match: { extensions: Object.keys(audioMimeTypes), mimeWildcards: ['audio/*'] },
		icon: AudioIcon,
		mimeType: mimeTypeFrom(audioMimeTypes, 'audio/mpeg'),
		viewer: { component: AudioFileTypeViewer },
		viewerKind: 'audio',
	},
	{
		id: 'video',
		label: '视频',
		priority: 100,
		match: { extensions: Object.keys(videoMimeTypes), mimeWildcards: ['video/*'] },
		icon: VideoIcon,
		mimeType: mimeTypeFrom(videoMimeTypes, 'video/mp4'),
		viewer: { component: VideoFileTypeViewer },
		viewerKind: 'video',
	},
	{
		id: 'directory',
		label: '目录',
		priority: 1000,
		match: { predicate: (file) => file.kind === 'directory' },
		icon: DirectoryIcon,
	},
];

setFileManagerBuiltinDefinitions(builtinFileManagerFileTypes);

function TextFileTypeViewer(props: FileManagerFileTypeViewerProps) {
	if (props.text === undefined) return null;
	return (
		<TextFileViewer
			draft={props.draft}
			editing={props.editing}
			error={props.saveError}
			file={props.file}
			messages={props.messages}
			onDraftChange={props.onDraftChange}
			onEditingChange={props.onEditingChange}
			onSave={props.onSave}
			pending={props.pending}
			readOnly={props.readOnly}
			showHeader={props.showTextHeader}
			text={props.text}
		/>
	);
}

function ImageFileTypeViewer(props: FileManagerFileTypeViewerProps) {
	return props.src ? (
		<ImageFileViewer
			downloadHref={props.downloadHref ?? props.src}
			file={props.file}
			messages={props.messages}
			onDownload={props.onDownload}
			src={props.src}
		/>
	) : null;
}

function PdfFileTypeViewer(props: FileManagerFileTypeViewerProps) {
	return props.src ? (
		<PdfFileViewer
			downloadHref={props.downloadHref ?? props.src}
			file={props.file}
			messages={props.messages}
			onDownload={props.onDownload}
			src={props.src}
		/>
	) : null;
}

function AudioFileTypeViewer(props: FileManagerFileTypeViewerProps) {
	return props.src ? (
		<AudioFileViewer
			downloadHref={props.downloadHref ?? props.src}
			file={props.file}
			messages={props.messages}
			onDownload={props.onDownload}
			src={props.src}
		/>
	) : null;
}

function VideoFileTypeViewer(props: FileManagerFileTypeViewerProps) {
	return props.src ? (
		<VideoFileViewer
			downloadHref={props.downloadHref ?? props.src}
			file={props.file}
			messages={props.messages}
			onDownload={props.onDownload}
			src={props.src}
		/>
	) : null;
}

function createFileTypeIcon(
	Icon: ComponentType<{ 'aria-hidden'?: boolean | 'false' | 'true'; className?: string }>,
	colorClassName: string,
): ComponentType<FileManagerFileTypeIconProps> {
	return function FileTypeIcon({ className }) {
		return <Icon aria-hidden='true' className={cn('shrink-0', colorClassName, className)} />;
	};
}

function mimeTypeFrom(values: Readonly<Record<string, string>>, fallback: string) {
	return (file: Readonly<FileManagerFileTypeMatchInput>) => values[file.extension] ?? fallback;
}
