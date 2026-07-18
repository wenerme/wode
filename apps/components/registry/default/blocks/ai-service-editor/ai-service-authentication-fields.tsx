import type { Service } from '@wener/ai/schema';
import type { ReactNode } from 'react';
import {
	AiConfigFieldGrid,
	AiConfigKeyValueField,
	AiConfigSecretField,
	AiConfigTextField,
	JsonValueEditor,
} from '../../ui/ai-config-editor';

export type AiServiceAuthenticationFieldsProps = {
	value: Service;
	onChange: (value: Service) => void;
	labels: { username: string; apiKey: string; password: string; headers: string; auth: string; credentials: string };
	disabled?: boolean;
	readOnly?: boolean;
	revealIdentity?: number | string;
	renderField?: (
		name: 'username' | 'apiKey' | 'password' | 'headers' | 'auth' | 'credentials',
		field: ReactNode,
	) => ReactNode;
};

export function AiServiceAuthenticationFields({
	value,
	onChange,
	labels,
	disabled = false,
	readOnly = false,
	revealIdentity,
	renderField = (_name, field) => field,
}: AiServiceAuthenticationFieldsProps) {
	const patch = (next: Partial<Service>) => onChange({ ...value, ...next });
	return (
		<>
			<AiConfigFieldGrid>
				{renderField(
					'username',
					<AiConfigTextField
						label={labels.username}
						value={value.username}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(username) => patch({ username: optional(username) })}
					/>,
				)}
				{renderField(
					'apiKey',
					<AiConfigSecretField
						label={labels.apiKey}
						revealIdentity={revealIdentity}
						value={value.apiKey}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(apiKey) => patch({ apiKey: optional(apiKey) })}
					/>,
				)}
				{renderField(
					'password',
					<AiConfigSecretField
						label={labels.password}
						revealIdentity={revealIdentity}
						value={value.password}
						disabled={disabled}
						readOnly={readOnly}
						onValueChange={(password) => patch({ password: optional(password) })}
					/>,
				)}
			</AiConfigFieldGrid>
			{renderField(
				'headers',
				<AiConfigKeyValueField
					className='mt-4'
					label={labels.headers}
					value={value.headers}
					disabled={disabled}
					readOnly={readOnly}
					onChange={(headers) => patch({ headers })}
				/>,
			)}
			<div className='mt-4 grid gap-4 lg:grid-cols-2'>
				{renderField(
					'auth',
					<JsonValueEditor
						label={labels.auth}
						value={value.auth ?? {}}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(auth) => patch({ auth: auth as Service['auth'] })}
					/>,
				)}
				{renderField(
					'credentials',
					<JsonValueEditor
						label={labels.credentials}
						value={value.credentials ?? {}}
						disabled={disabled}
						readOnly={readOnly}
						onChange={(credentials) => patch({ credentials: credentials as Service['credentials'] })}
					/>,
				)}
			</div>
		</>
	);
}

function optional(value: string): string | undefined {
	return value.trim() ? value : undefined;
}
