import { z } from 'zod';

export const GeminiBlobSchema = z.looseObject({
	mimeType: z.string().optional().describe('Media MIME type'),
	data: z.string().optional().describe('Base64-encoded media data'),
});

export const GeminiFileDataSchema = z.looseObject({
	mimeType: z.string().optional().describe('File MIME type'),
	fileUri: z.string().describe('File URI'),
});

export const GeminiFunctionCallSchema = z.looseObject({
	id: z.string().optional(),
	name: z.string().describe('Function name'),
	args: z.record(z.string(), z.unknown()).optional().describe('Function arguments'),
});

export const GeminiFunctionResponseSchema = z.looseObject({
	id: z.string().optional(),
	name: z.string().describe('Function name'),
	response: z.record(z.string(), z.unknown()).describe('Function result'),
	parts: z.array(z.unknown()).optional(),
});

export const GeminiPartSchema = z.looseObject({
	mediaResolution: z.looseObject({ level: z.string().optional() }).optional(),
	text: z.string().optional().describe('Text content'),
	inlineData: GeminiBlobSchema.optional().describe('Inline media data'),
	fileData: GeminiFileDataSchema.optional().describe('File reference'),
	functionCall: GeminiFunctionCallSchema.optional().describe('Function call'),
	functionResponse: GeminiFunctionResponseSchema.optional().describe('Function result'),
	executableCode: z.looseObject({ language: z.string(), code: z.string() }).optional(),
	codeExecutionResult: z.looseObject({ outcome: z.string(), output: z.string().optional() }).optional(),
	thought: z.boolean().optional().describe('Reasoning content'),
	thoughtSignature: z.string().optional().describe('Reasoning signature'),
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
	role: z.string().optional().describe('Message role'),
	parts: z.array(GeminiPartSchema).optional().describe('Message content parts'),
});

export const GeminiFunctionDeclarationSchema = z.looseObject({
	name: z.string().describe('Function name'),
	description: z.string().optional().describe('Function description'),
	parameters: z.unknown().optional().describe('Parameter schema'),
	parametersJsonSchema: z.unknown().optional().describe('Parameter JSON Schema'),
	response: z.unknown().optional().describe('Result schema'),
	responseJsonSchema: z.unknown().optional().describe('Result JSON Schema'),
});

export const GeminiToolSchema = z.looseObject({
	functionDeclarations: z.array(GeminiFunctionDeclarationSchema).optional().describe('Available functions'),
	googleSearch: z.looseObject({}).optional(),
	googleSearchRetrieval: z.looseObject({}).optional(),
	codeExecution: z.looseObject({}).optional(),
	urlContext: z.looseObject({}).optional(),
	retrieval: z.looseObject({}).optional(),
	fileSearch: z.looseObject({}).optional(),
});

export const GeminiSafetySettingSchema = z.looseObject({
	category: z.string(),
	threshold: z.string(),
	method: z.string().optional(),
});

export const GeminiGenerationConfigSchema = z.looseObject({
	candidateCount: z.number().multipleOf(1).optional().describe('Candidate count'),
	stopSequences: z.array(z.string()).optional().describe('Stop sequences'),
	maxOutputTokens: z.number().multipleOf(1).optional().describe('Maximum output tokens'),
	temperature: z.number().optional().describe('Sampling temperature'),
	topP: z.number().optional().describe('Nucleus sampling threshold'),
	topK: z.number().multipleOf(1).optional().describe('Top-k sampling count'),
	seed: z.number().multipleOf(1).optional().describe('Sampling random seed'),
	responseMimeType: z.string().optional().describe('Output MIME type'),
	responseSchema: z.unknown().optional().describe('Output schema'),
	responseJsonSchema: z.unknown().optional().describe('Output JSON Schema'),
	presencePenalty: z.number().optional().describe('Presence penalty'),
	frequencyPenalty: z.number().optional().describe('Frequency penalty'),
	responseLogprobs: z.boolean().optional(),
	logprobs: z.number().multipleOf(1).optional(),
	responseModalities: z.array(z.string()).optional(),
	routingConfig: z.looseObject({}).optional(),
	modelSelectionConfig: z.looseObject({}).optional(),
	thinkingConfig: z
		.looseObject({ includeThoughts: z.boolean().optional(), thinkingBudget: z.number().multipleOf(1).optional() })
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
	contents: z.array(GeminiContentSchema).describe('Conversation contents'),
	systemInstruction: GeminiContentSchema.optional().describe('System instructions'),
	tools: z.array(GeminiToolSchema).optional().describe('Available tools'),
	toolConfig: GeminiToolConfigSchema.optional().describe('Tool calling settings'),
	safetySettings: z.array(GeminiSafetySettingSchema).optional().describe('Safety settings'),
	generationConfig: GeminiGenerationConfigSchema.optional().describe('Generation parameters'),
	cachedContent: z.string().optional().describe('Cached content name'),
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
	index: z.number().multipleOf(1).optional(),
	safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
	citationMetadata: z.looseObject({}).optional(),
	groundingMetadata: z.looseObject({}).optional(),
	avgLogprobs: z.number().optional(),
	logprobsResult: z.looseObject({}).optional(),
	urlContextMetadata: z.looseObject({}).optional(),
});

export const GeminiModalityTokenCountSchema = z.looseObject({
	modality: z.string().optional(),
	tokenCount: z.number().multipleOf(1).optional(),
});

export const GeminiUsageMetadataSchema = z.looseObject({
	promptTokenCount: z.number().multipleOf(1).optional().describe('Input token count'),
	candidatesTokenCount: z.number().multipleOf(1).optional().describe('Candidate output token count'),
	totalTokenCount: z.number().multipleOf(1).optional().describe('Total token count'),
	cachedContentTokenCount: z.number().multipleOf(1).optional().describe('Cached content token count'),
	thoughtsTokenCount: z.number().multipleOf(1).optional().describe('Reasoning token count'),
	toolUsePromptTokenCount: z.number().multipleOf(1).optional().describe('Tool use input token count'),
	promptTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	candidatesTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	cacheTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	toolUsePromptTokensDetails: z.array(GeminiModalityTokenCountSchema).optional(),
	trafficType: z.string().optional(),
});

export const GeminiGenerateContentResponseSchema = z.looseObject({
	candidates: z.array(GeminiCandidateSchema).optional().describe('Generated candidates'),
	promptFeedback: z
		.looseObject({
			blockReason: z.string().optional(),
			blockReasonMessage: z.string().optional(),
			safetyRatings: z.array(GeminiSafetyRatingSchema).optional(),
		})
		.optional(),
	usageMetadata: GeminiUsageMetadataSchema.optional().describe('Token usage'),
	modelVersion: z.string().optional().describe('Model version'),
	responseId: z.string().optional().describe('Response identifier'),
	createTime: z.string().optional().describe('Response creation time'),
	modelStatus: z.looseObject({ modelStage: z.string().optional(), message: z.string().optional() }).optional(),
});

export const GeminiErrorResponseSchema = z.looseObject({
	error: z.looseObject({
		code: z.number().multipleOf(1),
		message: z.string(),
		status: z.string(),
		details: z.array(z.unknown()).optional(),
	}),
});

export type GeminiGenerateContentRequest = z.infer<typeof GeminiGenerateContentRequestSchema>;
export type GeminiGenerateContentResponse = z.infer<typeof GeminiGenerateContentResponseSchema>;
export type GeminiUsageMetadata = z.infer<typeof GeminiUsageMetadataSchema>;
