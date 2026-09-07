import type { ComponentPropsWithRef, ReactNode } from 'react';

export const AGENT_COMPOSER_DEFAULT_MAX_FILES = 5;
export const AGENT_COMPOSER_DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const AGENT_COMPOSER_DEFAULT_MAX_TOTAL_SIZE = 20 * 1024 * 1024;

export type AgentComposerStatus = 'ready' | 'submitting' | 'streaming' | 'error';

export type AgentComposerMessages = {
	attachAudio: string;
	attachFile: string;
	attachImage: string;
	attachmentsLabel: string;
	audioPreview: (name: string) => string;
	composerLabel: string;
	dropFiles: string;
	fileCountError: (maxFiles: number) => string;
	fileSizeError: (name: string, maxSize: string) => string;
	imagePreview: (name: string) => string;
	placeholder: string;
	removeAttachment: (name: string) => string;
	selectAudio: string;
	selectFile: string;
	selectImage: string;
	send: string;
	stop: string;
	totalSizeError: (maxSize: string) => string;
	unnamedFile: string;
};

export const defaultAgentComposerMessages: AgentComposerMessages = {
	attachAudio: '添加音频',
	attachFile: '添加文件',
	attachImage: '添加图片',
	attachmentsLabel: '附件',
	audioPreview: (name) => `音频预览：${name}`,
	composerLabel: '消息编辑器',
	dropFiles: '松开以添加附件',
	fileCountError: (maxFiles) => `最多添加 ${maxFiles} 个文件。`,
	fileSizeError: (name, maxSize) => `${name} 超过单个文件 ${maxSize} 的限制。`,
	imagePreview: (name) => `图片预览：${name}`,
	placeholder: '输入消息…',
	removeAttachment: (name) => `移除附件：${name}`,
	selectAudio: '选择音频文件',
	selectFile: '选择文件',
	selectImage: '选择图片文件',
	send: '发送',
	stop: '停止生成',
	totalSizeError: (maxSize) => `附件总大小不能超过 ${maxSize}。`,
	unnamedFile: '未命名文件',
};

export function resolveAgentComposerMessages(messages?: Partial<AgentComposerMessages>): AgentComposerMessages {
	return { ...defaultAgentComposerMessages, ...messages };
}

export type AgentComposerLimits = {
	maxFileSize?: number;
	maxFiles?: number;
	maxTotalSize?: number;
};

export type AgentComposerResolvedLimits = {
	maxFileSize: number;
	maxFiles: number;
	maxTotalSize: number;
};

export type AgentComposerErrorCode = 'file-count' | 'file-size' | 'total-size';

export type AgentComposerError = {
	code: AgentComposerErrorCode;
	files: File[];
	message: string;
};

export type AgentComposerSubmitValue = {
	files: File[];
	text: string;
};

export type AgentComposerProps = Omit<ComponentPropsWithRef<'form'>, 'onError' | 'onSubmit'> &
	AgentComposerLimits & {
		accept?: string;
		disabled?: boolean;
		error?: ReactNode;
		files: readonly File[];
		leading?: ReactNode;
		messages?: Partial<AgentComposerMessages>;
		microphone?: ReactNode;
		model?: ReactNode;
		onError?: (error: AgentComposerError) => void;
		onFilesChange: (files: File[]) => void;
		onStop?: () => void;
		onSubmit: (value: AgentComposerSubmitValue) => void;
		onValueChange: (value: string) => void;
		settings?: ReactNode;
		status?: AgentComposerStatus;
		textareaProps?: Omit<ComponentPropsWithRef<'textarea'>, 'disabled' | 'value'>;
		trailing?: ReactNode;
		value: string;
	};
