'use client';

import type { ComponentPropsWithRef } from 'react';
import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';
import type { AgentMessageTextRendererProps } from './agent-message-types';

export type AgentMarkdownProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
	children: string;
	streaming?: boolean;
};

export function AgentMarkdown({ children, className, streaming = false, ...props }: AgentMarkdownProps) {
	return (
		<div
			data-slot='agent-markdown'
			data-streaming={streaming ? 'true' : 'false'}
			className={cn(
				'[&_a]:text-primary [&_code]:bg-muted [&_pre]:bg-muted max-w-full min-w-0 leading-6 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:rounded-sm [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-3 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5',
				className,
			)}
			{...props}
		>
			<Streamdown>{children}</Streamdown>
		</div>
	);
}

export function AgentMessageDefaultTextRenderer({ text, streaming }: AgentMessageTextRendererProps) {
	return <AgentMarkdown streaming={streaming}>{text}</AgentMarkdown>;
}
