/** Compatibility exports; redaction is an explicit display/diagnostic operation. */

export type { RedactionOptions as ApolloRedactionOptions } from '../../../redact';
export {
	isSensitiveKey as isApolloSensitiveKey,
	redactCredentialShapes as redactApolloCredentialShapes,
	redactMessage as redactApolloMessage,
	redactText as redactApolloText,
	redactValue as redactApolloValue,
} from '../../../redact';
