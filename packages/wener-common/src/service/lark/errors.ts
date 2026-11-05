export const LarkServiceErrorCodes = {
	InvalidConfig: 'INVALID_CONFIG',
	MissingAppCredential: 'MISSING_APP_CREDENTIAL',
	MissingWebhookConfig: 'MISSING_WEBHOOK_CONFIG',
	ReadOnly: 'READ_ONLY',
	Closed: 'CLOSED',
	OperationFailed: 'OPERATION_FAILED',
} as const;
export type LarkServiceErrorCode = (typeof LarkServiceErrorCodes)[keyof typeof LarkServiceErrorCodes];

export class LarkServiceError extends Error {
	constructor(
		readonly code: LarkServiceErrorCode,
		message: string,
	) {
		super(message);
		this.name = 'LarkServiceError';
	}
}
