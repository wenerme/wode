import type { ComponentType, ReactNode } from 'react';
import type {
	FileViewerBytes,
	FileViewerFileDescriptor,
	FileViewerKind,
	FileViewerMessages,
} from './file-viewer-types';

export type FileManagerFileTypeInput = FileViewerFileDescriptor & {
	extension?: string;
	kind?: 'directory' | 'file';
};

export type FileManagerFileTypeMatchInput = FileManagerFileTypeInput & {
	extension: string;
	mimeType: string;
};

export type FileManagerFileTypeMatch = {
	extensions?: readonly string[];
	mimeTypes?: readonly string[];
	mimeWildcards?: readonly string[];
	predicate?: (file: Readonly<FileManagerFileTypeMatchInput>) => boolean;
};

export type FileManagerFileTypeIconProps = {
	'aria-hidden'?: boolean | 'false' | 'true';
	className?: string;
	file: Readonly<FileManagerFileTypeMatchInput>;
	fileType: FileManagerFileTypeDefinition;
};

export type FileManagerFileTypeViewerProps = {
	bytes?: FileViewerBytes;
	downloadHref?: string;
	draft?: string;
	editing?: boolean;
	file: FileViewerFileDescriptor;
	fileType: FileManagerFileTypeDefinition;
	messages: FileViewerMessages;
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

export type FileManagerFileTypeDisplayProps = {
	defaultDisplay: ReactNode;
	file: Readonly<FileManagerFileTypeMatchInput>;
	fileType: FileManagerFileTypeDefinition;
	mode: 'grid' | 'list';
};

export type FileManagerFileTypeDetailProps = {
	defaultDetail: ReactNode;
	file: Readonly<FileManagerFileTypeMatchInput>;
	fileType: FileManagerFileTypeDefinition;
};

export type FileManagerFileTypeRenderer<Props> = {
	component?: ComponentType<Props>;
	render?: (props: Props) => ReactNode;
};

export type FileManagerFileTypeDefinition = {
	detail?: FileManagerFileTypeRenderer<FileManagerFileTypeDetailProps>;
	display?: FileManagerFileTypeRenderer<FileManagerFileTypeDisplayProps>;
	editor?: FileManagerFileTypeRenderer<FileManagerFileTypeViewerProps>;
	icon?: ComponentType<FileManagerFileTypeIconProps>;
	id: string;
	label: ReactNode | ((file: Readonly<FileManagerFileTypeMatchInput>) => ReactNode);
	match: FileManagerFileTypeMatch;
	mimeType?: string | ((file: Readonly<FileManagerFileTypeMatchInput>) => string | undefined);
	priority?: number;
	viewer?: FileManagerFileTypeRenderer<FileManagerFileTypeViewerProps>;
	viewerKind?: FileViewerKind;
};

export type FileManagerFileTypeRegistry = {
	get(id: string): FileManagerFileTypeDefinition | undefined;
	list(): readonly FileManagerFileTypeDefinition[];
	register(definition: FileManagerFileTypeDefinition): () => void;
	resolve(file: FileManagerFileTypeInput): FileManagerFileTypeDefinition | undefined;
	resolveInput(file: FileManagerFileTypeInput): FileManagerFileTypeMatchInput;
	resolveMimeType(file: FileManagerFileTypeInput): string | undefined;
};

export type FileManagerRegistry = {
	readonly fileTypes: FileManagerFileTypeRegistry;
	readonly parent?: FileManagerRegistry;
};

export type CreateFileManagerOptions = {
	definitions?: Iterable<FileManagerFileTypeDefinition>;
	includeBuiltins?: boolean;
	parent?: FileManagerRegistry;
};

export type FileManagerFileTypeRendererProps =
	| FileManagerFileTypeViewerProps
	| FileManagerFileTypeDisplayProps
	| FileManagerFileTypeDetailProps;
