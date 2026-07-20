/**
 * Google Gemini API Schemas
 *
 * Generic schemas for Gemini-compatible APIs.
 * Note: generateContent and streamGenerateContent use the same request body.
 */
import { z } from 'zod';

// ============================================================================
// Content Parts
// ============================================================================

/**
 * Gemini content part
 */
export const PartSchema = z.union([
	z.looseObject({ text: z.string() }),
	z.looseObject({
		inlineData: z.looseObject({
			mimeType: z.string(),
			data: z.string(),
		}),
	}),
	z.looseObject({
		fileData: z.looseObject({
			mimeType: z.string().nullable().optional(),
			fileUri: z.string(),
		}),
	}),
	z.looseObject({
		functionCall: z.looseObject({
			name: z.string(),
			args: z.record(z.string(), z.any()),
		}),
	}),
	z.looseObject({
		functionResponse: z.looseObject({
			name: z.string(),
			response: z.record(z.string(), z.any()),
		}),
	}),
]);

/**
 * Gemini content
 */
export const ContentSchema = z.looseObject({
	role: z.enum(['user', 'model']),
	parts: z.array(PartSchema),
});

// ============================================================================
// Configuration
// ============================================================================

/**
 * Gemini generation config
 */
export const GenerationConfigSchema = z.looseObject({
	temperature: z.number().nullable().optional(),
	topP: z.number().nullable().optional(),
	topK: z.number().int().nullable().optional(),
	maxOutputTokens: z.number().int().nullable().optional(),
	stopSequences: z.array(z.string()).nullable().optional(),
	candidateCount: z.number().int().nullable().optional(),
	responseMimeType: z.string().nullable().optional(),
	responseSchema: z.record(z.string(), z.any()).nullable().optional(),
});

/**
 * Gemini safety setting
 */
export const SafetySettingSchema = z.looseObject({
	category: z.string(),
	threshold: z.string(),
});

/**
 * Gemini tool
 */
export const ToolSchema = z.looseObject({
	functionDeclarations: z
		.array(
			z.looseObject({
				name: z.string(),
				description: z.string().nullable().optional(),
				parameters: z.record(z.string(), z.any()).nullable().optional(),
			}),
		)
		.nullable()
		.optional(),
});

// ============================================================================
// Generate Content Request
// ============================================================================

/**
 * Generic Gemini Generate Content Request
 * Note: generateContent and streamGenerateContent use the same request body
 */
export const CreateGenerateContentRequestSchema = z.looseObject({
	contents: z.array(ContentSchema),
	systemInstruction: ContentSchema.nullable().optional(),
	tools: z.array(ToolSchema).nullable().optional(),
	toolConfig: z
		.looseObject({
			functionCallingConfig: z
				.looseObject({
					mode: z.enum(['AUTO', 'ANY', 'NONE']).nullable().optional(),
					allowedFunctionNames: z.array(z.string()).nullable().optional(),
				})
				.nullable()
				.optional(),
		})
		.nullable()
		.optional(),
	safetySettings: z.array(SafetySettingSchema).nullable().optional(),
	generationConfig: GenerationConfigSchema.nullable().optional(),
});
export type CreateGenerateContentRequest = z.infer<typeof CreateGenerateContentRequestSchema>;

// ============================================================================
// Generate Content Response
// ============================================================================

/**
 * Gemini candidate
 */
export const CandidateSchema = z.looseObject({
	content: ContentSchema.nullable().optional(),
	finishReason: z.string().nullable().optional(),
	safetyRatings: z
		.array(
			z.looseObject({
				category: z.string(),
				probability: z.string(),
				blocked: z.boolean().nullable().optional(),
			}),
		)
		.nullable()
		.optional(),
	citationMetadata: z
		.looseObject({
			citations: z.array(z.any()).nullable().optional(),
		})
		.nullable()
		.optional(),
	tokenCount: z.number().int().nullable().optional(),
	index: z.number().int().nullable().optional(),
});

/**
 * Generic Gemini Generate Content Response
 */
export const CreateGenerateContentResponseSchema = z.looseObject({
	candidates: z.array(CandidateSchema).nullable().optional(),
	promptFeedback: z
		.looseObject({
			blockReason: z.string().nullable().optional(),
			safetyRatings: z
				.array(
					z.looseObject({
						category: z.string(),
						probability: z.string(),
					}),
				)
				.nullable()
				.optional(),
		})
		.nullable()
		.optional(),
	usageMetadata: z
		.looseObject({
			promptTokenCount: z.number().int().nullable().optional(),
			candidatesTokenCount: z.number().int().nullable().optional(),
			totalTokenCount: z.number().int().nullable().optional(),
		})
		.nullable()
		.optional(),
});
export type CreateGenerateContentResponse = z.infer<typeof CreateGenerateContentResponseSchema>;
