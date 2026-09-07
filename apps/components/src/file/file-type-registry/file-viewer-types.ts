export type FileViewerKind = 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'unsupported';

export type FileViewerBytes = ArrayBuffer | Uint8Array;

export type FileViewerFileDescriptor = {
	name: string;
	path?: string;
	mimeType?: string;
	size?: number;
	lastModified?: Date | number;
	meta?: Readonly<Record<string, unknown>>;
};

export type FileViewerFile = FileViewerFileDescriptor;

export type FileViewerMessages = {
	audioLabel: (file: FileViewerFileDescriptor) => string;
	cancel: string;
	dimensions: (width: number, height: number) => string;
	download: string;
	edit: string;
	editingActionsLabel: (file: FileViewerFileDescriptor) => string;
	editFileLabel: (file: FileViewerFileDescriptor) => string;
	editorLabel: (file: FileViewerFileDescriptor) => string;
	fileName: string;
	fileSize: string;
	fileTooLarge: (maxBytes: number) => string;
	imageAlt: (file: FileViewerFileDescriptor) => string;
	lastModified: string;
	loadFailed: (error: unknown) => string;
	loading: string;
	mimeType: string;
	missingSource: string;
	mediaLoadFailed: (file: FileViewerFileDescriptor) => string;
	openInNewWindow: string;
	pdfFallback: string;
	pdfLabel: (file: FileViewerFileDescriptor) => string;
	readOnly: string;
	save: string;
	saveFailed: (error: unknown) => string;
	saving: string;
	unsupportedDescription: string;
	unsupportedTitle: string;
	videoLabel: (file: FileViewerFileDescriptor) => string;
};

export const defaultFileViewerMessages: FileViewerMessages = {
	audioLabel: (file) => `${file.name} 音频播放器`,
	cancel: '取消',
	dimensions: (width, height) => `${width} × ${height} 像素`,
	download: '下载文件',
	edit: '编辑',
	editingActionsLabel: (file) => `${file.name} 编辑操作`,
	editFileLabel: (file) => `编辑 ${file.name}`,
	editorLabel: (file) => `编辑 ${file.name}`,
	fileName: '文件名',
	fileSize: '大小',
	fileTooLarge: (maxBytes) => `文件超过预览上限 ${formatFileViewerBytes(maxBytes)}`,
	imageAlt: (file) => file.name,
	lastModified: '修改时间',
	loadFailed: (error) => `无法读取文件：${getFileViewerErrorMessage(error)}`,
	loading: '正在读取文件…',
	mimeType: 'MIME 类型',
	missingSource: '暂无可预览内容',
	mediaLoadFailed: (file) => `${file.name} 加载失败`,
	openInNewWindow: '在新窗口打开',
	pdfFallback: '当前浏览器无法内嵌预览 PDF。',
	pdfLabel: (file) => `${file.name} PDF 预览`,
	readOnly: '只读',
	save: '保存',
	saveFailed: (error) => `保存失败：${getFileViewerErrorMessage(error)}`,
	saving: '保存中',
	unsupportedDescription: '当前文件类型不支持内嵌预览。',
	unsupportedTitle: '无法预览此文件',
	videoLabel: (file) => `${file.name} 视频播放器`,
};

export function mergeFileViewerMessages(overrides?: Partial<FileViewerMessages>): FileViewerMessages {
	return { ...defaultFileViewerMessages, ...overrides };
}

export function getFileViewerErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function formatFileViewerBytes(bytes: number | undefined): string {
	if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return '—';
	if (bytes < 1024) return `${Math.floor(bytes)} B`;
	const units = ['KB', 'MB', 'GB', 'TB'] as const;
	let value = bytes / 1024;
	let unit: (typeof units)[number] = units[0];
	for (let index = 1; index < units.length && value >= 1024; index += 1) {
		value /= 1024;
		unit = units[index];
	}
	return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

export function formatFileViewerDate(value: Date | number | undefined): string {
	if (value === undefined) return '—';
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
