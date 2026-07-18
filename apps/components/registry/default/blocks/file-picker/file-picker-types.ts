import type { ReactNode } from 'react';
import type { FileManagerFileStat, FileManagerFileSystem, FileManagerProps } from '../file-manager';

export type FilePickerAcceptType = {
	accept: Record<string, readonly string[]>;
	description?: string;
};

export type DirectoryPickerResult = {
	kind: 'directory';
	path: string;
};

export type SaveFilePickerResult = {
	directory: string;
	existing?: FileManagerFileStat;
	kind: 'file';
	name: string;
	path: string;
};

export type FilePickerMessages = {
	cancel: string;
	confirmDirectory: string;
	confirmOpen: string;
	confirmSave: string;
	emptyDirectory: string;
	emptyFiles: string;
	fileName: string;
	fileType: string;
	noFile: string;
	openingDirectory: string;
	overwrite: string;
	overwriteDescription: (name: string) => ReactNode;
	overwriteTitle: string;
	savingTarget: string;
};

export type FilePickerCommonProps = Omit<
	FileManagerProps,
	| 'capabilities'
	| 'emptyState'
	| 'filterEntry'
	| 'footer'
	| 'onActivateEntry'
	| 'onOpenFile'
	| 'readOnly'
	| 'selectionMode'
	| 'store'
	| 'title'
> & {
	allowCreateDirectory?: boolean;
	fileSystem: FileManagerFileSystem;
	messages?: Partial<FilePickerMessages>;
	onCancel?: () => void;
	preview?: boolean;
	title?: ReactNode;
};

export type SingleFilePickerProps = FilePickerCommonProps & {
	accept?: readonly FilePickerAcceptType[];
	multiple?: false;
	onConfirm: (result: FileManagerFileStat) => void;
};

export type MultipleFilePickerProps = FilePickerCommonProps & {
	accept?: readonly FilePickerAcceptType[];
	multiple: true;
	onConfirm: (result: FileManagerFileStat[]) => void;
};

export type FilePickerProps = MultipleFilePickerProps | SingleFilePickerProps;

export type DirectoryPickerProps = FilePickerCommonProps & {
	onConfirm: (result: DirectoryPickerResult) => void;
};

export type SaveFilePickerProps = FilePickerCommonProps & {
	accept?: readonly FilePickerAcceptType[];
	onConfirm: (result: SaveFilePickerResult) => void;
	suggestedName?: string;
};

export type FilePickerMode = 'directory' | 'open' | 'save';

export type FilePickerCoreProps = FilePickerCommonProps & {
	accept?: readonly FilePickerAcceptType[];
	mode: FilePickerMode;
	multiple?: boolean;
	onConfirm: (
		result: DirectoryPickerResult | FileManagerFileStat | FileManagerFileStat[] | SaveFilePickerResult,
	) => void;
	suggestedName?: string;
};
