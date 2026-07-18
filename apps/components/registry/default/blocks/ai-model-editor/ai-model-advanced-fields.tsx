import type { Model, ModelCapabilities, ModelCost, ModelDefaults, ModelLimits } from '@wener/ai/schema';
import {
	type AiConfigEditorSlots,
	AiConfigFieldGrid,
	AiConfigNumberField,
	AiConfigTextField,
	AiConfigToggleField,
} from '../../ui/ai-config-editor';

const capabilityFields: readonly { key: keyof Omit<ModelCapabilities, 'extensions'>; label: string }[] = [
	{ key: 'messageGeneration', label: '消息生成' },
	{ key: 'textCompletion', label: '文本补全' },
	{ key: 'embedding', label: '向量嵌入' },
	{ key: 'imageGeneration', label: '图像生成' },
	{ key: 'imageEditing', label: '图像编辑' },
	{ key: 'reranking', label: '重排序' },
	{ key: 'tokenCounting', label: 'Token 计数' },
	{ key: 'reasoning', label: 'Reasoning' },
	{ key: 'toolCall', label: '工具调用' },
	{ key: 'attachment', label: '附件' },
	{ key: 'temperature', label: 'Temperature' },
	{ key: 'structuredOutput', label: '结构化输出' },
	{ key: 'jsonSchema', label: 'JSON Schema' },
	{ key: 'jsonObject', label: 'JSON Object' },
];

export type AiModelAdvancedFieldsProps = {
	value: Model;
	onChange: (value: Model) => void;
	disabled?: boolean;
	readOnly?: boolean;
	slots?: AiConfigEditorSlots<Model>;
};

export function AiModelCapabilitiesFields({
	value,
	onChange,
	disabled = false,
	readOnly = false,
}: AiModelAdvancedFieldsProps) {
	const capabilities = value.capabilities ?? {};
	const update = (key: keyof Omit<ModelCapabilities, 'extensions'>, enabled: boolean) =>
		onChange({ ...value, capabilities: { ...capabilities, [key]: enabled } });
	return (
		<AiConfigFieldGrid className='lg:grid-cols-3'>
			{capabilityFields.map(({ key, label }) => (
				<AiConfigToggleField
					key={key}
					label={label}
					checked={capabilities[key] ?? false}
					disabled={disabled || readOnly}
					onCheckedChange={(enabled) => update(key, enabled)}
				/>
			))}
		</AiConfigFieldGrid>
	);
}

export function AiModelLimitFields({
	value,
	onChange,
	disabled = false,
	readOnly = false,
}: AiModelAdvancedFieldsProps) {
	const limits = value.limits ?? {};
	const update = (patch: Partial<ModelLimits>) => onChange({ ...value, limits: { ...limits, ...patch } });
	return (
		<AiConfigFieldGrid>
			<AiConfigNumberField
				label='限制 · Context'
				value={limits.context}
				integer
				min={1}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(context) => update({ context })}
			/>
			<AiConfigNumberField
				label='限制 · Input'
				value={limits.input}
				integer
				min={1}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(input) => update({ input })}
			/>
			<AiConfigNumberField
				label='限制 · Output'
				value={limits.output}
				integer
				min={1}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(output) => update({ output })}
			/>
			<AiConfigNumberField
				label='每分钟请求'
				value={limits.requestsPerMinute}
				integer
				min={1}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(requestsPerMinute) => update({ requestsPerMinute })}
			/>
			<AiConfigNumberField
				label='每分钟 Token'
				value={limits.tokensPerMinute}
				integer
				min={1}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(tokensPerMinute) => update({ tokensPerMinute })}
			/>
		</AiConfigFieldGrid>
	);
}

export function AiModelCostDefaultFields({
	value,
	onChange,
	disabled = false,
	readOnly = false,
}: AiModelAdvancedFieldsProps) {
	const cost = value.cost ?? {};
	const defaults = value.defaults ?? {};
	const updateCost = (patch: Partial<ModelCost>) => onChange({ ...value, cost: { ...cost, ...patch } });
	const updateDefaults = (patch: Partial<ModelDefaults>) => onChange({ ...value, defaults: { ...defaults, ...patch } });
	return (
		<div className='grid min-w-0 gap-6 xl:grid-cols-2'>
			<div>
				<h4 className='mb-3 text-xs font-semibold'>成本</h4>
				<AiConfigFieldGrid>
					<AiConfigNumberField
						label='输入成本'
						value={cost.input}
						min={0}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(input) => updateCost({ input })}
					/>
					<AiConfigNumberField
						label='输出成本'
						value={cost.output}
						min={0}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(output) => updateCost({ output })}
					/>
					<AiConfigNumberField
						label='缓存读取成本'
						value={cost.cacheRead}
						min={0}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(cacheRead) => updateCost({ cacheRead })}
					/>
					<AiConfigNumberField
						label='缓存写入成本'
						value={cost.cacheWrite}
						min={0}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(cacheWrite) => updateCost({ cacheWrite })}
					/>
					<AiConfigNumberField
						label='Reasoning 成本'
						value={cost.reasoning}
						min={0}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(reasoning) => updateCost({ reasoning })}
					/>
					<AiConfigTextField
						label='币种'
						value={cost.currency}
						placeholder='USD'
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(currency) => updateCost({ currency: optional(currency) })}
					/>
					<AiConfigTextField
						label='成本单位'
						value={cost.unit}
						placeholder='1M tokens'
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(unit) => updateCost({ unit: optional(unit) })}
					/>
				</AiConfigFieldGrid>
			</div>
			<div>
				<h4 className='mb-3 text-xs font-semibold'>默认推理参数</h4>
				<AiConfigFieldGrid>
					<AiConfigNumberField
						label='Temperature'
						value={defaults.temperature}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(temperature) => updateDefaults({ temperature })}
					/>
					<AiConfigNumberField
						label='Top P'
						value={defaults.topP}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(topP) => updateDefaults({ topP })}
					/>
					<AiConfigNumberField
						label='Top K'
						value={defaults.topK}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(topK) => updateDefaults({ topK })}
					/>
					<AiConfigNumberField
						label='Max Tokens'
						value={defaults.maxTokens}
						integer
						min={1}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(maxTokens) => updateDefaults({ maxTokens })}
					/>
					<AiConfigNumberField
						label='Frequency Penalty'
						value={defaults.frequencyPenalty}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(frequencyPenalty) => updateDefaults({ frequencyPenalty })}
					/>
					<AiConfigNumberField
						label='Presence Penalty'
						value={defaults.presencePenalty}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(presencePenalty) => updateDefaults({ presencePenalty })}
					/>
				</AiConfigFieldGrid>
			</div>
		</div>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
