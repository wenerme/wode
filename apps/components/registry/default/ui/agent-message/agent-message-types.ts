import type { UIMessage } from 'ai';
import type { ComponentType, ReactNode } from 'react';

export type AgentMessagePart = UIMessage['parts'][number];

export type AgentMessageMessages = {
	assistantRole: string;
	audioAttachment: string;
	documentSource: string;
	fileAttachment: string;
	imageAttachment: string;
	malformedPart: string;
	openSource: string;
	reasoning: string;
	reasoningStreaming: string;
	step: (step: number) => string;
	systemRole: string;
	toolApprovalReason: string;
	toolInput: string;
	toolOutput: string;
	toolState: (state: string, approved?: boolean) => string;
	unknownPart: (type: string) => string;
	unnamedAttachment: string;
	unnamedSource: string;
	unnamedTool: string;
	userRole: string;
};

export const defaultAgentMessageMessages: AgentMessageMessages = {
	assistantRole: '助手',
	audioAttachment: '音频附件',
	documentSource: '文档来源',
	fileAttachment: '文件附件',
	imageAttachment: '图片附件',
	malformedPart: '无法显示的消息内容',
	openSource: '打开来源',
	reasoning: '提供方推理摘要',
	reasoningStreaming: '提供方正在生成推理摘要',
	step: (step) => `步骤 ${step}`,
	systemRole: '系统',
	toolApprovalReason: '审批说明',
	toolInput: '输入',
	toolOutput: '输出',
	toolState: (state, approved) => {
		switch (state) {
			case 'input-streaming':
				return '正在接收参数';
			case 'input-available':
				return '等待执行';
			case 'approval-requested':
				return '等待批准';
			case 'approval-responded':
				return approved === false ? '已拒绝' : '已批准';
			case 'output-available':
				return '已完成';
			case 'output-error':
				return '执行失败';
			case 'output-denied':
				return '已拒绝';
			default:
				return '未知状态';
		}
	},
	unknownPart: (type) => `暂不支持的消息内容：${type}`,
	unnamedAttachment: '附件',
	unnamedSource: '来源',
	unnamedTool: '工具',
	userRole: '你',
};

export function resolveAgentMessageMessages(messages?: Partial<AgentMessageMessages>): AgentMessageMessages {
	return { ...defaultAgentMessageMessages, ...messages };
}

export type AgentMessageTextRendererProps = {
	message: UIMessage;
	part: AgentMessagePart;
	streaming: boolean;
	text: string;
};

export type AgentMessageTextRenderer = ComponentType<AgentMessageTextRendererProps>;

export type AgentMessagePartRenderContext = {
	index: number;
	message: UIMessage;
	part: AgentMessagePart;
	step: number;
};

export type AgentMessagePartRenderer = (context: AgentMessagePartRenderContext) => ReactNode | undefined;

export type AgentMessageReasoningLabel = (context: {
	message: UIMessage;
	part: AgentMessagePart;
	streaming: boolean;
}) => ReactNode;
