import type { Persona } from '@wener/ai/agent/persona';
import { AiConfigFieldGrid, AiConfigStringListField, AiConfigTextareaField } from '../../ui/ai-config-editor';

export type PersonaSectionFieldsProps = {
	value: Persona;
	onChange: (value: Persona) => void;
	disabled?: boolean;
	readOnly?: boolean;
};

export function PersonaAuthoringFields({
	value,
	onChange,
	disabled = false,
	readOnly = false,
}: PersonaSectionFieldsProps) {
	const patch = (next: Partial<NonNullable<Persona['authoring']>>) =>
		onChange({ ...value, authoring: { ...value.authoring, ...next } });
	return (
		<AiConfigFieldGrid>
			<AiConfigTextareaField
				label='背景'
				value={value.authoring?.background}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(background) => patch({ background: optional(background) })}
			/>
			<AiConfigTextareaField
				label='性格'
				value={value.authoring?.personality}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(personality) => patch({ personality: optional(personality) })}
			/>
			<AiConfigTextareaField
				label='行为策略'
				value={value.authoring?.behaviorPolicy}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(behaviorPolicy) => patch({ behaviorPolicy: optional(behaviorPolicy) })}
			/>
			<AiConfigTextareaField
				label='语言风格'
				value={value.authoring?.speechStyle}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(speechStyle) => patch({ speechStyle: optional(speechStyle) })}
			/>
			<AiConfigStringListField
				label='价值观'
				value={value.authoring?.values}
				disabled={disabled}
				readOnly={readOnly}
				onChange={(values) => patch({ values })}
			/>
			<AiConfigStringListField
				label='目标'
				value={value.authoring?.goals}
				disabled={disabled}
				readOnly={readOnly}
				onChange={(goals) => patch({ goals })}
			/>
			<AiConfigStringListField
				label='缺点'
				value={value.authoring?.flaws}
				disabled={disabled}
				readOnly={readOnly}
				onChange={(flaws) => patch({ flaws })}
			/>
			<AiConfigStringListField
				label='示例对话'
				value={value.authoring?.exampleDialogue}
				disabled={disabled}
				readOnly={readOnly}
				onChange={(exampleDialogue) => patch({ exampleDialogue })}
			/>
		</AiConfigFieldGrid>
	);
}

export function PersonaPromptFields({
	value,
	onChange,
	disabled = false,
	readOnly = false,
}: PersonaSectionFieldsProps) {
	const patch = (next: Partial<NonNullable<Persona['prompts']>>) =>
		onChange({ ...value, prompts: { ...value.prompts, ...next } });
	return (
		<div className='grid gap-4 lg:grid-cols-2'>
			<AiConfigTextareaField
				label='System Prompt'
				rows={6}
				value={value.prompts?.system}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(system) => patch({ system: optional(system) })}
			/>
			<AiConfigTextareaField
				label='Persona Prompt'
				rows={6}
				value={value.prompts?.persona}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(persona) => patch({ persona: optional(persona) })}
			/>
			<AiConfigTextareaField
				label='场景'
				rows={5}
				value={value.prompts?.scenario}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(scenario) => patch({ scenario: optional(scenario) })}
			/>
			<AiConfigTextareaField
				label='历史后指令'
				rows={5}
				value={value.prompts?.postHistoryInstructions}
				disabled={disabled}
				readOnly={readOnly}
				onValueChange={(postHistoryInstructions) =>
					patch({ postHistoryInstructions: optional(postHistoryInstructions) })
				}
			/>
		</div>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
