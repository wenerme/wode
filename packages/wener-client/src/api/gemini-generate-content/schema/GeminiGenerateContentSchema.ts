import { z } from 'zod';

const wireString = z.string().min(1);

export const GeminiBlobSchema = z.looseObject({
	mimeType: wireString,
	data: z.string(),
});

export const GeminiFileDataSchema = z.looseObject({
	mimeType: z.string().optional(),
	fileUri: wireString,
});

export const GeminiFunctionCallSchema = z.looseObject({
	id: z.string().optional(),
	name: wireString,
	args: z.record(z.string(), z.unknown()).optional(),
});

export const GeminiFunctionResponseSchema = z.looseObject({
	id: z.string().optional(),
	name: wireString,
	response: z.record(z.string(), z.unknown()),
	parts: z.array(z.unknown()).optional(),
});

export const GeminiPartSchema = z.looseObject({
	mediaResolution: z.looseObject({ level: z.string().optional() }).optional(),
	text: z.string().optional(),
	inlineData: GeminiBlobSchema.optional(),
	fileData: GeminiFileDataSchema.optional(),
	functionCall: GeminiFunctionCallSchema.optional(),
	functionResponse: GeminiFunctionResponseSchema.optional(),
	executableCode: z.looseObject({ language: wireString, code: z.string() }).optional(),
	codeExecutionResult: z.looseObject({ outcome: wireString, output: z.string().optional() }).optional(),
	thought: z.boolean().optional(),
	thoughtSignature: z.string().optional(),
	videoMetadata: z
		.looseObject({
			startOffset: z.string().optional(),
			endOffset: z.string().optional(),
			fps: z.number().optional(),
		})
		.optional(),
	partMetadata: z.record(z.string(), z.unknown()).optional(),
	toolCall: z
		.looseObject({ id: z.string().optional(), name: z.string().optional(), args: z.unknown().optional() })
		.optional(),
	toolResponse: z
		.looseObject({ id: z.string().optional(), name: z.string().optional(), response: z.unknown().optional() })
		.optional(),
});

export const GeminiContentSchema = z.looseObject({
	role: z.string().optional(),
	parts: z.array(GeminiPartSchema),
});

export const GeminiFunctionDeclarationSchema = z.looseObject({
	name: wireString,
	description: z.string().optional(),
	parameters: z.unknown().optional(),
	parametersJsonSchema: z.unknown().optional(),
	response: z.unknown().optional(),
	responseJsonSchema: z.unknown().optional(),
});

export const GeminiToolSchema = z.looseObject({
	functionDeclarations: z.array(GeminiFunctionDeclarationSchema).optional(),
	googleSearch: z.looseObject({}).optional(),
	googleSearchRetrieval: z.looseObject({}).optional(),
	codeExecution: z.looseObject({}).optional(),
	urlContext: z.looseObject({}).optional(),
	retrieval: z.looseObject({}).optional(),
	fileSearch: z.looseObject({}).optional(),
});

export const GeminiSafetySettingSchema = z.looseObject({
	category: wireString,
	threshold: wireString,
	method: z.string().optional(),
});

export const GeminiGenerationConfigSchema = z.looseObject({
	candidateCount: z.number().int().positive().optional(),
	stopSequences: z.array(z.string()).optional(),
	maxOutputTokens: z.number().int().positive().optional(),
	temperature: z.number().optional(),
	topP: z.number().optional(),
	topK: z.number().int().optional(),
	seed: z.number().int().optional(),
	responseMimeType: z.string().optional(),
	responseSchema: z.unknown().optional(),
	responseJsonSchema: z.unknown().optional(),
	presencePenalty: z.number().optional(),
	frequencyPenalty: z.number().optional(),
	responseLogprobs: z.boolean().optional(),
	logprobs: z.number().int().nonnegative().optional(),
	responseModalities: z.array(z.string()).optional(),
	routingConfig: z.looseObject({}).optional(),
	modelSelectionConfig: z.looseObject({}).optional(),
	thinkingConfig: z
		.looseObject({ includeThoughts: z.boolean().optional(), thinkingBudget: z.number().int().optional() })
		.optional(),
	imageConfig: z.looseObject({ aspectRatio: z.string().optional() }).optional(),
	mediaResolution: z.string().optional(),
	speechConfig: z.unknown().optional(),
	audioTimestamp: z.boolean().optional(),
	enableAffectiveDialog: z.boolean().optional(),
	enableEnhancedCivicAnswers: z.boolean().optional(),
});

export const GeminiToolConfigSchema = z.looseObject({
	functionCallingConfig: z
		.looseObject({
			mode: z.string().optional(),
			allowedFunctionNames: z.array(z.string()).optional(),
			streamFunctionCallArguments: z.boolean().optional(),
		})
		.optional(),
	retrievalConfig: z
		.looseObject({
			latLng: z.looseObject({ latitude: z.number().optional(), longitude: z.number().optional() }).optional(),
			languageCode: z.string().optional(),
		})
		.optional(),
	includeServerSideToolInvocations: z.boolean().optional(),
});

export const GeminiGenerateContentRequestSchema = z.looseObject({
	contents: z.array(GeminiContentSchema).min(1),
	systemInstruction: GeminiContentSchema.optional(),
	tools: z.array(GeminiToolSchema).optional(),
	toolConfig: GeminiToolConfigSchema.optional(),
	safetySettings: z.array(GeminiSafetySettingSchema).optional(),
	generationConfig: GeminiGenerationConfigSchema.optional(),
	cachedContent: z.string().optional(),
});

export const GeminiSafetyRatingSchema = z.looseObject({
	category: z.string().optional(),
	probability: z.string().optional(),
	blocked: z.boolean().optional(),
	probabilityScore: z.number().optional(),
	severity: z.string().optional(),
	severityScore: z.number().optional(),
});

export const GeminiCandidateSchema = z.looseObject({
	content: GeminiContentSchema.optional(),
	finishReason: z.string().optional(),
	finishMessage: z.string().optional(),
	index: z.number().int().nonnegative().optional(),
	safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
	citationMetadata: z.looseObject({}).optional(),
	groundingMetadata: z.looseObject({}).optional(),
	avgLogprobs: z.number().optional(),
	logprobsResult: z.looseObject({}).optional(),
	urlContextMetadata: z.looseObject({}).optional(),
});

export const GeminiModalityTokenCountSchema = z.looseObject({
	modality: z.string().optional(),
	tokenCount: z.number().int().nonnegative().optional(),
});

export const GeminiUsageMetadataSchema = z.looseObject({
	promptTokenCount: z.number().int().nonnegative().optional(),
	candidatesTokenCount: z.number().int().nonnegative().optional(),
	totalTokenCount: z.number().int().nonnegative().optional(),
	cachedContentTokenCount: z.number().int().nonnegative().optional(),
	thoughtsTokenCount: z.number().int().nonnegative().optional(),
	toolUsePromptTokenCount: z.number().int().nonnegative().optional(),
	promptTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	candidatesTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	cacheTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	toolUsePromptTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	trafficType: z.string().optional(),
});

export const GeminiGenerateContentResponseSchema = z.looseObject({
	candidates: z.array(GeminiCandidateSchema).optional(),
	promptFeedback: z
		.looseObject({
			blockReason: z.string().optional(),
			blockReasonMessage: z.string().optional(),
			safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
		})
		.optional(),
	usageMetadata: GeminiUsageMetadataSchema.optional(),
	modelVersion: z.string().optional(),
	responseId: z.string().optional(),
	createTime: z.string().optional(),
	modelStatus: z.looseObject({ modelStage: z.string().optional(), message: z.string().optional() }).optional(),
});

export const GeminiErrorResponseSchema = z.looseObject({
	error: z.looseObject({
		code: z.number().int(),
		message: z.string(),
		status: z.string(),
		details: z.array(z.unknown()).optional(),
	}),
});

export type GeminiGenerateContentRequest = z.infer<typeof GeminiGenerateContentRequestSchema>;
export type GeminiGenerateContentResponse = z.infer<typeof GeminiGenerateContentResponseSchema>;
export type GeminiUsageMetadata = z.infer<typeof GeminiUsageMetadataSchema>;
