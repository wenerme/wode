import type { AiConfigEditorMessageOverrides, AiConfigEditorMessages } from './ai-config-types';

export const defaultAiConfigEditorMessages: AiConfigEditorMessages = {
	formMode: '表单',
	jsonMode: 'JSON',
	reset: '重置',
	submit: '应用配置',
	applyJson: '应用 JSON',
	invalidExternalTitle: '外部配置无效',
	invalidExternalDescription: '当前显示安全回退草稿；原始值未被修改。修正后才会发出变更。',
	invalidJson: 'JSON 内容无法解析或不符合配置约束。',
	validationTitle: '请检查以下配置问题',
	validationCount: (count) => `${count} 个问题`,
	jsonLabel: '配置 JSON',
	readOnly: '只读',
};

export function mergeAiConfigEditorMessages(overrides?: AiConfigEditorMessageOverrides): AiConfigEditorMessages {
	return { ...defaultAiConfigEditorMessages, ...overrides };
}
