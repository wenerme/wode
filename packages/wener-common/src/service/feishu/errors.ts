export const FeishuServiceErrorCodes = {
	InvalidConfig: 'INVALID_CONFIG',
	InvalidInput: 'INVALID_INPUT',
	MissingAppCredential: 'MISSING_APP_CREDENTIAL',
	MissingWebhookConfig: 'MISSING_WEBHOOK_CONFIG',
	ReadOnly: 'READ_ONLY',
	Closed: 'CLOSED',
	OperationFailed: 'OPERATION_FAILED',
} as const;
export type FeishuServiceErrorCode = (typeof FeishuServiceErrorCodes)[keyof typeof FeishuServiceErrorCodes];

export class FeishuServiceError extends Error {
	/** Validated Feishu `log_id` for support tickets; never contains secrets. */
	declare readonly logId?: string;

	constructor(
		readonly code: FeishuServiceErrorCode,
		message: string,
		detail: { logId?: string } = {},
	) {
		super(message);
		this.name = 'FeishuServiceError';
		if (detail.logId !== undefined) this.logId = detail.logId;
	}
}
