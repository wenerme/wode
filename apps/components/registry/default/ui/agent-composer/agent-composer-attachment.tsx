'use client';

import { FileText, Music2, X } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatAgentComposerBytes } from './agent-composer-files';
import type { AgentComposerMessages } from './agent-composer-types';

export type AgentComposerAttachmentProps = Omit<ComponentPropsWithRef<'li'>, 'children'> & {
	file: File;
	messages: AgentComposerMessages;
	onRemove: () => void;
};

export function AgentComposerAttachment({
	className,
	file,
	messages,
	onRemove,
	...props
}: AgentComposerAttachmentProps) {
	const mediaKind = resolveMediaKind(file.type);
	const objectUrl = useAgentComposerObjectUrl(file, mediaKind !== 'file');
	const name = file.name || messages.unnamedFile;
	return (
		<li
			data-slot='agent-composer-attachment'
			data-media={mediaKind}
			className={cn(
				'border-border bg-background flex min-h-10 max-w-full min-w-0 items-center gap-2 rounded-md border px-2 py-1.5 text-xs',
				className,
			)}
			{...props}
		>
			{mediaKind === 'image' && objectUrl ? (
				<img
					alt={messages.imagePreview(name)}
					className='bg-muted size-8 shrink-0 rounded-sm object-cover'
					height={32}
					src={objectUrl}
					width={32}
				/>
			) : null}
			{mediaKind === 'audio' ? <Music2 aria-hidden='true' className='text-muted-foreground size-4 shrink-0' /> : null}
			{mediaKind === 'file' ? <FileText aria-hidden='true' className='text-muted-foreground size-4 shrink-0' /> : null}
			<div className='min-w-0 flex-1'>
				<div className='truncate font-medium'>{name}</div>
				<div className='text-muted-foreground'>{formatAgentComposerBytes(file.size)}</div>
			</div>
			{mediaKind === 'audio' && objectUrl ? (
				// biome-ignore lint/a11y/useMediaCaption: User-provided previews do not have a transcript track.
				<audio
					aria-label={messages.audioPreview(name)}
					className='h-8 w-40 max-w-[40vw]'
					controls
					preload='metadata'
					src={objectUrl}
				/>
			) : null}
			<button
				type='button'
				className='btn btn-ghost btn-circle btn-xs size-7 min-h-7 min-w-7 shrink-0 p-0'
				aria-label={messages.removeAttachment(name)}
				title={messages.removeAttachment(name)}
				onClick={onRemove}
			>
				<X aria-hidden='true' className='size-3.5' />
			</button>
		</li>
	);
}

function useAgentComposerObjectUrl(file: File, enabled: boolean): string | undefined {
	const [state, setState] = useState<{ file: File; url: string }>();
	useEffect(() => {
		if (!enabled || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
			setState(undefined);
			return;
		}
		const url = URL.createObjectURL(file);
		setState({ file, url });
		return () => URL.revokeObjectURL(url);
	}, [enabled, file]);
	return state?.file === file ? state.url : undefined;
}

function resolveMediaKind(mediaType: string): 'audio' | 'file' | 'image' {
	if (mediaType.startsWith('image/')) return 'image';
	if (mediaType.startsWith('audio/')) return 'audio';
	return 'file';
}
