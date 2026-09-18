'use client';

import { Check, Eye, EyeOff, RefreshCw, X } from 'lucide-react';
import type { ComponentPropsWithRef, FormEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
	ConnectionValidationIssue,
	OpenAICompatibleConnectionConfig,
	OpenAICompatibleConnectionDraft,
} from './connection-config';
import { validateOpenAICompatibleBaseUrl, validateOpenAICompatibleConnection } from './connection-config';
import { listOpenAICompatibleModels } from './model-list';
import { toSafeAgentError } from './safe-error';

export type OpenAICompatibleConnectionEditorMessages = {
	apiKey: string;
	apply: string;
	baseUrl: string;
	clearApiKey: string;
	hideApiKey: string;
	loadedModels: (count: number) => string;
	model: string;
	modelList: string;
	refreshModels: string;
	showApiKey: string;
};

export const defaultOpenAICompatibleConnectionEditorMessages: OpenAICompatibleConnectionEditorMessages = {
	apiKey: 'API Key',
	apply: '应用连接',
	baseUrl: 'Base URL',
	clearApiKey: '清除 API Key',
	hideApiKey: '隐藏 API Key',
	loadedModels: (count) => `已加载 ${count} 个模型`,
	model: '模型',
	modelList: '可用模型',
	refreshModels: '刷新模型',
	showApiKey: '显示 API Key',
};

export type OpenAICompatibleConnectionEditorProps = Omit<ComponentPropsWithRef<'form'>, 'onSubmit'> & {
	applied?: boolean;
	draft: OpenAICompatibleConnectionDraft;
	fetch?: typeof globalThis.fetch;
	messages?: Partial<OpenAICompatibleConnectionEditorMessages>;
	onApply: (connection: OpenAICompatibleConnectionConfig) => void;
	onDraftChange: (draft: OpenAICompatibleConnectionDraft) => void;
	revealIdentity?: number | string;
};

export function OpenAICompatibleConnectionEditor({
	applied = false,
	className,
	draft,
	fetch,
	messages,
	onApply,
	onDraftChange,
	revealIdentity,
	...props
}: OpenAICompatibleConnectionEditorProps) {
	const copy = { ...defaultOpenAICompatibleConnectionEditorMessages, ...messages };
	const modelListId = useId();
	const refreshController = useRef<AbortController | undefined>(undefined);
	const modelGeneration = useRef(0);
	const [showKey, setShowKey] = useState(false);
	const [models, setModels] = useState<string[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [issues, setIssues] = useState<ConnectionValidationIssue[]>([]);
	const [requestError, setRequestError] = useState<string>();

	useEffect(() => {
		setShowKey(false);
	}, [revealIdentity]);

	useEffect(() => {
		modelGeneration.current += 1;
		refreshController.current?.abort();
		refreshController.current = undefined;
		setModels([]);
		setRefreshing(false);
		setRequestError(undefined);
	}, [draft.apiKey, draft.baseUrl, draft.headers, revealIdentity]);

	useEffect(
		() => () => {
			modelGeneration.current += 1;
			refreshController.current?.abort();
		},
		[],
	);

	function update<Key extends keyof OpenAICompatibleConnectionDraft>(
		key: Key,
		value: OpenAICompatibleConnectionDraft[Key],
	) {
		setIssues((current) => current.filter((issue) => issue.field !== key));
		setRequestError(undefined);
		if (key === 'apiKey' || key === 'baseUrl' || key === 'headers') {
			modelGeneration.current += 1;
			refreshController.current?.abort();
			refreshController.current = undefined;
			setModels([]);
			setRefreshing(false);
		}
		onDraftChange({ ...draft, [key]: value });
	}

	function apply(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const result = validateOpenAICompatibleConnection(draft);
		if (!result.success) {
			setIssues(result.issues);
			return;
		}
		setIssues([]);
		setRequestError(undefined);
		onApply(result.value);
	}

	async function refreshModels() {
		const baseUrl = validateOpenAICompatibleBaseUrl(draft.baseUrl);
		if (!baseUrl.success) {
			setIssues([{ field: 'baseUrl', message: baseUrl.message }]);
			return;
		}
		refreshController.current?.abort();
		const controller = new AbortController();
		const generation = modelGeneration.current + 1;
		modelGeneration.current = generation;
		refreshController.current = controller;
		setRefreshing(true);
		setRequestError(undefined);
		try {
			const result = await listOpenAICompatibleModels(
				{ apiKey: draft.apiKey, baseUrl: baseUrl.value, headers: draft.headers },
				{ fetch, signal: controller.signal },
			);
			if (refreshController.current !== controller || modelGeneration.current !== generation) return;
			setModels(result.map((model) => model.id));
		} catch (error) {
			if (!controller.signal.aborted) setRequestError(toSafeAgentError(error, [draft.apiKey ?? '']).message);
		} finally {
			if (refreshController.current === controller && modelGeneration.current === generation) {
				refreshController.current = undefined;
				setRefreshing(false);
			}
		}
	}

	const fieldError = (field: ConnectionValidationIssue['field']) =>
		issues.find((issue) => issue.field === field)?.message;
	return (
		<form
			data-slot='openai-compatible-connection-editor'
			data-applied={applied ? 'true' : 'false'}
			className={cn('bg-background grid min-w-0 gap-3 p-3 md:grid-cols-2', className)}
			onSubmit={apply}
			{...props}
		>
			<label className='form-control min-w-0 gap-1 md:col-span-2'>
				<span className='label-text text-xs'>{copy.baseUrl}</span>
				<input
					type='url'
					className='input input-bordered input-sm w-full'
					aria-invalid={Boolean(fieldError('baseUrl')) || undefined}
					autoCapitalize='none'
					autoComplete='url'
					placeholder='https://example.com/v1'
					spellCheck={false}
					value={draft.baseUrl}
					onChange={(event) => update('baseUrl', event.currentTarget.value)}
				/>
				<FieldError>{fieldError('baseUrl')}</FieldError>
			</label>
			<label className='form-control min-w-0 gap-1'>
				<span className='label-text text-xs'>{copy.apiKey}</span>
				<span className='join flex w-full'>
					<input
						type={showKey ? 'text' : 'password'}
						className='input input-bordered input-sm join-item min-w-0 flex-1'
						autoCapitalize='none'
						autoComplete='new-password'
						spellCheck={false}
						value={draft.apiKey ?? ''}
						onChange={(event) => update('apiKey', event.currentTarget.value)}
					/>
					<button
						type='button'
						className='btn btn-outline btn-sm join-item px-2'
						aria-label={showKey ? copy.hideApiKey : copy.showApiKey}
						title={showKey ? copy.hideApiKey : copy.showApiKey}
						onClick={() => setShowKey((value) => !value)}
					>
						{showKey ? <EyeOff aria-hidden='true' className='size-4' /> : <Eye aria-hidden='true' className='size-4' />}
					</button>
					<button
						type='button'
						className='btn btn-outline btn-sm join-item px-2'
						aria-label={copy.clearApiKey}
						title={copy.clearApiKey}
						disabled={!draft.apiKey}
						onClick={() => update('apiKey', '')}
					>
						<X aria-hidden='true' className='size-4' />
					</button>
				</span>
				<FieldError>{fieldError('apiKey')}</FieldError>
			</label>
			<label className='form-control min-w-0 gap-1'>
				<span className='label-text text-xs'>{copy.model}</span>
				<input
					type='text'
					list={modelListId}
					className='input input-bordered input-sm w-full'
					aria-invalid={Boolean(fieldError('model')) || undefined}
					autoCapitalize='none'
					spellCheck={false}
					placeholder='example-model'
					value={draft.model}
					onChange={(event) => update('model', event.currentTarget.value)}
				/>
				<datalist id={modelListId}>
					{models.map((model) => (
						<option key={model} value={model} />
					))}
				</datalist>
				<FieldError>{fieldError('model')}</FieldError>
			</label>
			{models.length > 0 ? (
				<label className='form-control min-w-0 gap-1 md:col-span-2'>
					<span className='label-text text-xs'>{copy.modelList}</span>
					<select
						className='select select-bordered select-sm w-full'
						aria-label={copy.modelList}
						value={models.includes(draft.model) ? draft.model : ''}
						onChange={(event) => update('model', event.currentTarget.value)}
					>
						<option value=''>{copy.loadedModels(models.length)}</option>
						{models.map((model) => (
							<option key={model}>{model}</option>
						))}
					</select>
				</label>
			) : null}
			{requestError ? (
				<div role='alert' className='text-error min-w-0 text-xs break-words md:col-span-2'>
					{requestError}
				</div>
			) : null}
			<div className='flex flex-wrap items-center justify-end gap-2 md:col-span-2'>
				<button
					type='button'
					className='btn btn-ghost btn-sm'
					disabled={refreshing}
					onClick={() => void refreshModels()}
				>
					<RefreshCw aria-hidden='true' className={cn('size-4', refreshing && 'animate-spin')} />
					{copy.refreshModels}
				</button>
				<button type='submit' className='btn btn-primary btn-sm'>
					<Check aria-hidden='true' className='size-4' />
					{copy.apply}
				</button>
			</div>
		</form>
	);
}

function FieldError({ children }: { children?: string }) {
	return children ? <span className='text-error text-xs'>{children}</span> : null;
}
