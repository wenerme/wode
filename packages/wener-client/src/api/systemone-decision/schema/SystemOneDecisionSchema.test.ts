import { describe, expect, test } from 'vitest';
import { SystemOneDecisionRequestSchema, SystemOneDecisionResponseSchema } from './SystemOneDecisionSchema';

describe('SystemOne Decision schemas', () => {
	test('解析三类问题、结构化 instructions 与可选 criteria', () => {
		const request = SystemOneDecisionRequestSchema.parse({
			model: 'typesafe/jev-1.13',
			state: { customer_tier: 'enterprise', ticket: 'blank screen after Pay' },
			questions: {
				is_bug: {
					type: 'noul',
					instructions: 'Is the customer reporting a software defect?',
					criteria: { true: 'broken behavior', false: 'question or feature request' },
				},
				team: {
					type: 'choice',
					instructions: { question: 'Which team owns `ticket`?', context: { region: 'EU' } },
					criteria: { payments: 'billing issues', frontend: null },
				},
				urgency: { type: 'score', instructions: 'How urgent?', criteria: ['later', 'this week', 'now'] },
			},
			extra: 'kept',
		});
		expect(request).toMatchObject({ model: 'typesafe/jev-1.13', extra: 'kept' });
		expect(
			SystemOneDecisionRequestSchema.parse({ state: ['a', 'b'], questions: { q: { type: 'noul', instructions: 'x' } } })
				.model,
		).toBeUndefined();
	});

	test.each([
		['缺少 state', { questions: { q: { type: 'noul', instructions: 'x' } } }],
		['空 questions', { state: 'x', questions: {} }],
		['未知问题类型', { state: 'x', questions: { q: { type: 'rank', instructions: 'x' } } }],
		['choice 无选项', { state: 'x', questions: { q: { type: 'choice', instructions: 'x', criteria: {} } } }],
		['score 只有一级', { state: 'x', questions: { q: { type: 'score', instructions: 'x', criteria: ['a'] } } }],
		['state 为数字', { state: 1, questions: { q: { type: 'noul', instructions: 'x' } } }],
	])('拒绝%s', (_name, value) => {
		expect(SystemOneDecisionRequestSchema.safeParse(value).success).toBe(false);
	});

	test('校验错误消息使用英文', () => {
		const messages = [
			SystemOneDecisionRequestSchema.safeParse({ state: 'x', questions: {} }),
			SystemOneDecisionRequestSchema.safeParse({
				state: 'x',
				questions: { q: { type: 'choice', instructions: 'x', criteria: {} } },
			}),
		].flatMap((result) => result.error?.issues.map((issue) => issue.message) ?? []);
		expect(messages).toEqual(
			expect.arrayContaining([
				'questions must contain at least one question',
				'choice criteria must contain at least one option',
			]),
		);
		for (const message of messages) expect(message).not.toMatch(/\p{Script=Han}/u);
	});

	test('解析官方、托管版与 OpenRouter 响应', () => {
		const answers = {
			is_bug: { type: 'noul', noul: 0.96 },
			team: { type: 'choice', choice: 'payments', probabilities: { payments: 0.84, frontend: 0.16 }, confidence: 0.75 },
			urgency: {
				type: 'score',
				score: 1.99,
				legend: { '0': 'later', '1': 'this week', '2': 'now' },
				probabilities: { '0': 0, '1': 0.01, '2': 0.99 },
				confidence: 0.99,
			},
		};
		expect(
			SystemOneDecisionResponseSchema.parse({
				model: 'jev-1.13.0',
				answers,
				usage: { input_tokens: 296, output_tokens: 20 },
			}),
		).toMatchObject({ model: 'jev-1.13.0' });
		expect(
			SystemOneDecisionResponseSchema.parse({
				model: 'jev-1.13.0',
				answers,
				usage: { input_tokens: 62, output_tokens: 0, cost_usd: 0.000026, credits_remaining_usd: 4.99 },
			}).usage,
		).toMatchObject({ cost_usd: 0.000026 });
		expect(
			SystemOneDecisionResponseSchema.parse({
				id: 'gen-dec-1',
				model: 'typesafe/jev-1.13-20260917',
				provider: 'TypeSafe',
				answers,
				usage: { cost: 0.000019992, input_tokens: 476, output_tokens: 70 },
			}),
		).toMatchObject({ id: 'gen-dec-1', provider: 'TypeSafe' });
		// 托管版示例中 score 可不带 legend 与 confidence。
		expect(
			SystemOneDecisionResponseSchema.safeParse({
				model: 'jev-1.13.0',
				answers: { u: { type: 'score', score: 3, probabilities: { '0': 0, '3': 1 } } },
			}).success,
		).toBe(true);
	});

	test('拒绝缺少判别字段的答案', () => {
		expect(
			SystemOneDecisionResponseSchema.safeParse({ model: 'jev', answers: { q: { type: 'choice', probabilities: {} } } })
				.success,
		).toBe(false);
	});
});
