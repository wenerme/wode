/**
 * Google Gemini API Schema
 * Based on Gemini API specification
 */
import { z } from 'zod';

// ============================================================================
// Content Part Types
// ============================================================================

/**
 * Text part
 */
export const TextPartSchema = z.object({
	text: z.string(),
});
export type TextPart = z.infer<typeof TextPartSchema>;

/**
 * Inline data (base64 encoded)
 */
export const InlineDataPartSchema = z.object({
	inlineData: z.object({
		mimeType: z.string(),
		data: z.string(),
	}),
});
export type InlineDataPart = z.infer<typeof InlineDataPartSchema>;

/**
 * File data reference
 */
export const FileDataPartSchema = z.object({
	fileData: z.object({
		mimeType: z.string().optional(),
		fileUri: z.string(),
	}),
});
export type FileDataPart = z.infer<typeof FileDataPartSchema>;

/**
 * Function call from model
 */
export const FunctionCallPartSchema = z.object({
	functionCall: z.object({
		name: z.string(),
		args: z.record(z.string(), z.any()),
	}),
});
export type FunctionCallPart = z.infer<typeof FunctionCallPartSchema>;

/**
 * Function response from user
 */
export const FunctionResponsePartSchema = z.object({
	functionResponse: z.object({
		name: z.string(),
		response: z.record(z.string(), z.any()),
	}),
});
export type FunctionResponsePart = z.infer<typeof FunctionResponsePartSchema>;

/**
 * Part union
 */
export const PartSchema = z.union([
	TextPartSchema,
	InlineDataPartSchema,
	FileDataPartSchema,
	FunctionCallPartSchema,
	FunctionResponsePartSchema,
]);
export type Part = z.infer<typeof PartSchema>;

// ============================================================================
// Content Types
// ============================================================================

/**
 * Content with role
 */
export const ContentSchema = z.object({
	role: z.enum(['user', 'model']),
	parts: z.array(PartSchema),
});
export type Content = z.infer<typeof ContentSchema>;

// ============================================================================
// Tool Types
// ============================================================================

/**
 * Function declaration
 */
export const FunctionDeclarationSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	parameters: z.record(z.string(), z.any()).optional(),
});
export type FunctionDeclaration = z.infer<typeof FunctionDeclarationSchema>;

/**
 * Tool definition
 */
export const GeminiToolSchema = z.object({
	functionDeclarations: z.array(FunctionDeclarationSchema).optional(),
});
export type GeminiTool = z.infer<typeof GeminiToolSchema>;

/**
 * Tool config
 */
export const ToolConfigSchema = z.object({
	functionCallingConfig: z
		.object({
			mode: z.enum(['AUTO', 'ANY', 'NONE']).optional(),
			allowedFunctionNames: z.array(z.string()).optional(),
		})
		.optional(),
});
export type ToolConfig = z.infer<typeof ToolConfigSchema>;

// ============================================================================
// Safety Types
// ============================================================================

/**
 * Harm category
 */
export const HarmCategorySchema = z.enum([
	'HARM_CATEGORY_UNSPECIFIED',
	'HARM_CATEGORY_HATE_SPEECH',
	'HARM_CATEGORY_SEXUALLY_EXPLICIT',
	'HARM_CATEGORY_DANGEROUS_CONTENT',
	'HARM_CATEGORY_HARASSMENT',
]);
export type HarmCategory = z.infer<typeof HarmCategorySchema>;

/**
 * Safety setting
 */
export const SafetySettingSchema = z.object({
	category: HarmCategorySchema,
	threshold: z.enum([
		'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
		'BLOCK_LOW_AND_ABOVE',
		'BLOCK_MEDIUM_AND_ABOVE',
		'BLOCK_ONLY_HIGH',
		'BLOCK_NONE',
	]),
});
export type SafetySetting = z.infer<typeof SafetySettingSchema>;

/**
 * Safety rating in response
 */
export const SafetyRatingSchema = z.object({
	category: HarmCategorySchema,
	probability: z.enum(['NEGLIGIBLE', 'LOW', 'MEDIUM', 'HIGH']),
	blocked: z.boolean().optional(),
});
export type SafetyRating = z.infer<typeof SafetyRatingSchema>;

// ============================================================================
// Generation Config
// ============================================================================

/**
 * Generation configuration
 */
export const GenerationConfigSchema = z.object({
	temperature: z.number().optional(),
	topP: z.number().optional(),
	topK: z.number().int().optional(),
	maxOutputTokens: z.number().int().optional(),
	stopSequences: z.array(z.string()).optional(),
	candidateCount: z.number().int().optional(),
	responseMimeType: z.string().optional(),
	responseSchema: z.record(z.string(), z.any()).optional(),
});
export type GenerationConfig = z.infer<typeof GenerationConfigSchema>;

// ============================================================================
// Request Types
// ============================================================================

/**
 * Generate content request
 */
export const GenerateContentRequestSchema = z.object({
	contents: z.array(ContentSchema),
	systemInstruction: ContentSchema.optional(),
	tools: z.array(GeminiToolSchema).optional(),
	toolConfig: ToolConfigSchema.optional(),
	safetySettings: z.array(SafetySettingSchema).optional(),
	generationConfig: GenerationConfigSchema.optional(),
});
export type GenerateContentRequest = z.infer<typeof GenerateContentRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Finish reason
 */
export const FinishReasonSchema = z.enum([
	'FINISH_REASON_UNSPECIFIED',
	'STOP',
	'MAX_TOKENS',
	'SAFETY',
	'RECITATION',
	'OTHER',
]);
export type FinishReason = z.infer<typeof FinishReasonSchema>;

/**
 * Candidate
 */
export const CandidateSchema = z.object({
	content: ContentSchema.optional(),
	finishReason: FinishReasonSchema.optional(),
	safetyRatings: z.array(SafetyRatingSchema).optional(),
	citationMetadata: z
		.object({
			citations: z.array(z.any()).optional(),
		})
		.optional(),
	tokenCount: z.number().int().optional(),
	index: z.number().int().optional(),
});
export type Candidate = z.infer<typeof CandidateSchema>;

/**
 * Usage metadata
 */
export const UsageMetadataSchema = z.object({
	promptTokenCount: z.number().int().optional(),
	candidatesTokenCount: z.number().int().optional(),
	totalTokenCount: z.number().int().optional(),
});
export type UsageMetadata = z.infer<typeof UsageMetadataSchema>;

/**
 * Generate content response
 */
export const GenerateContentResponseSchema = z.object({
	candidates: z.array(CandidateSchema).optional(),
	promptFeedback: z
		.object({
			blockReason: z.string().optional(),
			safetyRatings: z.array(SafetyRatingSchema).optional(),
		})
		.optional(),
	usageMetadata: UsageMetadataSchema.optional(),
});
export type GenerateContentResponse = z.infer<typeof GenerateContentResponseSchema>;
