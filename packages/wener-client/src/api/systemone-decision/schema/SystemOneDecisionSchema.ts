import { z } from 'zod';

/**
 * System One Decision 线协议：TypeSafe 与 llama.cpp `POST /v1/systemone`、
 * OpenRouter `POST /api/v1/systemone` 或 `POST /api/alpha/decisions`。
 * Jev 是使用该协议的模型。各实现共享 state/questions/answers 核心结构，
 * model 必填、多模态输入及 usage 等字段的要求由具体服务校验。
 * OpenAI `POST /v1/decisions` 使用另一组 input/questions 数组与 predicate 类型，不能复用本 schema。
 * 上游文档给出的上限（choice 最多 255 个选项、score 最多 10 级、约 64k token）由上游校验，
 * 这里只保证结构正确，避免代理比上游更严格。
 */

/** instructions、criteria 描述和 state 均可为纯文本或结构化数据；字段通过反引号名称引用。 */
const SystemOneStructuredSchema = z.union([z.string(), z.array(z.unknown()), z.record(z.string(), z.unknown())]);

export const SystemOneDecisionStateSchema = SystemOneStructuredSchema;
export const SystemOneDecisionInstructionsSchema = SystemOneStructuredSchema;

/** noul：校准后的是/否问题；criteria 可选，分别描述 yes 与 no 的含义。 */
export const SystemOneNoulQuestionSchema = z.looseObject({
	type: z.literal('noul'),
	instructions: SystemOneDecisionInstructionsSchema,
	criteria: z
		.looseObject({
			true: SystemOneStructuredSchema.nullish(),
			false: SystemOneStructuredSchema.nullish(),
		})
		.optional(),
});

/** choice：从命名选项中选出一个；选项描述可为 null。 */
export const SystemOneChoiceQuestionSchema = z.looseObject({
	type: z.literal('choice'),
	instructions: SystemOneDecisionInstructionsSchema,
	criteria: z
		// 选项描述为 null 是上游线协议的合法值（只给选项名不给描述）；record value 没有缺省语义，保留 nullable。
		.record(z.string().min(1), SystemOneStructuredSchema.nullable())
		.refine((criteria) => Object.keys(criteria).length > 0, 'choice criteria must contain at least one option'),
});

/** score：按从低到高排列的等级描述打分，至少两级。 */
export const SystemOneScoreQuestionSchema = z.looseObject({
	type: z.literal('score'),
	instructions: SystemOneDecisionInstructionsSchema,
	criteria: z.array(SystemOneStructuredSchema).min(2),
});

export const SystemOneDecisionQuestionSchema = z.discriminatedUnion('type', [
	SystemOneNoulQuestionSchema,
	SystemOneChoiceQuestionSchema,
	SystemOneScoreQuestionSchema,
]);

export const SystemOneDecisionRequestSchema = z.looseObject({
	/** 模型名：TypeSafe 的 `jev-latest` 或固定版本（如 `jev-1.13.0`、OpenRouter 的 `typesafe/jev-1.13`）；TypeSafe 上游缺省时为 `jev-latest`。 */
	model: z.string().min(1).optional(),
	state: SystemOneDecisionStateSchema,
	/** 问题 key 由调用方命名，答案按相同 key 返回；key 不参与推理。 */
	questions: z
		.record(z.string().min(1), SystemOneDecisionQuestionSchema)
		.refine((questions) => Object.keys(questions).length > 0, 'questions must contain at least one question'),
});

const Probability = z.number().finite();
const Probabilities = z.record(z.string(), Probability);

export const SystemOneNoulAnswerSchema = z.looseObject({
	type: z.literal('noul'),
	/** 回答为 yes 的概率，0 表示 no，1 表示 yes。 */
	noul: Probability,
});

export const SystemOneChoiceAnswerSchema = z.looseObject({
	type: z.literal('choice'),
	choice: z.string(),
	probabilities: Probabilities,
	confidence: Probability.optional(),
});

export const SystemOneScoreAnswerSchema = z.looseObject({
	type: z.literal('score'),
	/** 按概率加权的等级值，可能落在两级之间。 */
	score: z.number().finite(),
	/** 等级序号（字符串 key）到等级描述的映射。 */
	legend: z.record(z.string(), SystemOneStructuredSchema).optional(),
	probabilities: Probabilities,
	confidence: Probability.optional(),
});

export const SystemOneDecisionAnswerSchema = z.discriminatedUnion('type', [
	SystemOneNoulAnswerSchema,
	SystemOneChoiceAnswerSchema,
	SystemOneScoreAnswerSchema,
]);

/** 官方 usage 只含 token；托管版追加 cost_usd/credits_remaining_usd，OpenRouter 追加 cost。 */
export const SystemOneDecisionUsageSchema = z.looseObject({
	input_tokens: z.number().int().nonnegative().optional(),
	output_tokens: z.number().int().nonnegative().optional(),
	cost: z.number().nonnegative().optional(),
	cost_usd: z.number().nonnegative().optional(),
	credits_remaining_usd: z.number().optional(),
});

export const SystemOneDecisionResponseSchema = z.looseObject({
	/** OpenRouter 返回生成 ID，官方与托管版不返回。 */
	id: z.string().optional(),
	/** 实际执行的模型版本，例如 `jev-1.13.0`。 */
	model: z.string(),
	provider: z.string().optional(),
	answers: z.record(z.string(), SystemOneDecisionAnswerSchema),
	usage: SystemOneDecisionUsageSchema.optional(),
});

export type SystemOneDecisionQuestion = z.infer<typeof SystemOneDecisionQuestionSchema>;
export type SystemOneDecisionAnswer = z.infer<typeof SystemOneDecisionAnswerSchema>;
export type SystemOneDecisionUsage = z.infer<typeof SystemOneDecisionUsageSchema>;
export type SystemOneDecisionRequest = z.infer<typeof SystemOneDecisionRequestSchema>;
export type SystemOneDecisionResponse = z.infer<typeof SystemOneDecisionResponseSchema>;
