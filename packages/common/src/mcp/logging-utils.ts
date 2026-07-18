/**
 * MCP Logging utilities
 *
 * @see LOGGING_AND_EXPERIMENTAL.md for detailed usage guide
 */

import type { LoggingLevel, LoggingMessageNotification } from '@modelcontextprotocol/sdk/types.js';

/**
 * 日志级别优先级映射（数字越大优先级越高）
 */
export const LOG_LEVEL_PRIORITY: Record<LoggingLevel, number> = {
	debug: 0,
	info: 1,
	notice: 2,
	warning: 3,
	error: 4,
	critical: 5,
	alert: 6,
	emergency: 7,
};

/**
 * 检查日志级别是否应该被发送
 *
 * @param messageLevel 消息的日志级别
 * @param minLevel 最低日志级别（由客户端设置）
 * @returns 如果应该发送该日志则返回 true
 *
 * @example
 * ```typescript
 * shouldLogMessage('debug', 'warning') // false
 * shouldLogMessage('error', 'warning') // true
 * shouldLogMessage('warning', 'warning') // true
 * ```
 */
export function shouldLogMessage(messageLevel: LoggingLevel, minLevel: LoggingLevel): boolean {
	return LOG_LEVEL_PRIORITY[messageLevel] >= LOG_LEVEL_PRIORITY[minLevel];
}

/**
 * 创建结构化日志消息参数
 *
 * @example
 * ```typescript
 * const params = createLogMessage('info', 'Operation completed', 'my-module');
 * await server.sendLoggingMessage(params);
 * ```
 */
export function createLogMessage(
	level: LoggingLevel,
	data: unknown,
	logger?: string,
): LoggingMessageNotification['params'] {
	return {
		level,
		data,
		...(logger && { logger }),
	};
}

/**
 * 日志消息构建器
 *
 * @example
 * ```typescript
 * const log = new LogMessageBuilder('my-service');
 *
 * await server.sendLoggingMessage(log.info('Started'));
 * await server.sendLoggingMessage(log.error('Failed', { error: err }));
 * await server.sendLoggingMessage(log.debug({ step: 1, data: 'processing' }));
 * ```
 */
export class LogMessageBuilder {
	constructor(private readonly logger?: string) {}

	debug(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('debug', data, this.logger);
	}

	info(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('info', data, this.logger);
	}

	notice(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('notice', data, this.logger);
	}

	warning(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('warning', data, this.logger);
	}

	error(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('error', data, this.logger);
	}

	critical(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('critical', data, this.logger);
	}

	alert(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('alert', data, this.logger);
	}

	emergency(data: unknown): LoggingMessageNotification['params'] {
		return createLogMessage('emergency', data, this.logger);
	}
}

/**
 * 格式化日志消息用于控制台输出
 *
 * @example
 * ```typescript
 * client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
 *   console.log(formatLogMessage(notification.params));
 * });
 * ```
 */
export function formatLogMessage(params: LoggingMessageNotification['params']): string {
	const timestamp = new Date().toISOString();
	const level = params.level.toUpperCase().padEnd(9);
	const logger = params.logger ? `[${params.logger}]` : '';
	const data = typeof params.data === 'string' ? params.data : JSON.stringify(params.data);

	return `${timestamp} ${level} ${logger} ${data}`;
}

/**
 * Experimental 能力类型定义示例
 *
 * 根据你的需求定义自己的 experimental 能力类型
 */
export interface ExperimentalCapabilities {
	/**
	 * 富文本支持
	 */
	richText?: {
		version: string;
		formats: string[];
	};

	/**
	 * 批量操作
	 */
	batchOperations?: {
		enabled: boolean;
		maxBatchSize: number;
	};

	/**
	 * 流式响应
	 */
	streamingResponse?: {
		enabled: boolean;
		maxChunkSize?: number;
	};

	/**
	 * 自定义认证
	 */
	authentication?: {
		methods: string[];
		tokenEndpoint?: string;
	};

	/**
	 * 其他自定义能力
	 */
	[key: string]: unknown;
}

/**
 * 检查 experimental 能力是否启用
 *
 * @example
 * ```typescript
 * const caps = capabilities.experimental as ExperimentalCapabilities;
 * if (hasExperimentalCapability(caps, 'richText')) {
 *   // 使用富文本特性
 * }
 * ```
 */
export function hasExperimentalCapability(
	experimental: Record<string, unknown> | undefined,
	capability: string,
): boolean {
	if (!experimental) return false;
	const cap = experimental[capability];
	if (!cap) return false;
	if (typeof cap === 'object' && cap !== null && 'enabled' in cap) {
		return cap.enabled === true;
	}
	return true;
}

/**
 * 获取 experimental 能力的版本
 *
 * @example
 * ```typescript
 * const version = getExperimentalCapabilityVersion(
 *   capabilities.experimental,
 *   'richText'
 * );
 * if (version && compareVersion(version, '1.0.0') >= 0) {
 *   // 使用 1.0.0+ 版本的特性
 * }
 * ```
 */
export function getExperimentalCapabilityVersion(
	experimental: Record<string, unknown> | undefined,
	capability: string,
): string | undefined {
	if (!experimental) return undefined;
	const cap = experimental[capability];
	if (typeof cap === 'object' && cap !== null && 'version' in cap) {
		return typeof cap.version === 'string' ? cap.version : undefined;
	}
	return undefined;
}
