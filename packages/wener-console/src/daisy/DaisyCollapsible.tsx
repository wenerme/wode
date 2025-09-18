import React, { type FC } from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import { cn } from '@wener/console';

type RootProps = React.ComponentProps<typeof Collapsible.Root>;

export const DaisyCollapsibleRoot: FC<RootProps> = ({ className, ...props }) => {
	return (
		<Collapsible.Root
			className={cn('collapse-arrow data-[state=open]:collapse-open collapse rounded-none', className)}
			{...props}
		/>
	);
};

type TriggerProps = React.ComponentProps<typeof Collapsible.Trigger>;

export const DaisyCollapsibleTrigger: FC<TriggerProps> = ({ className, ...props }) => {
	return <Collapsible.Trigger className={cn('collapse-title', className)} {...props} />;
};

type PanelProps = React.ComponentProps<typeof Collapsible.Panel>;

export const DaisyCollapsiblePanel: FC<PanelProps> = ({ className, ...props }) => {
	return <Collapsible.Panel className={cn('collapse-content', className)} {...props} />;
};

export const DaisyCollapsible = {
	Root: DaisyCollapsibleRoot,
	Trigger: DaisyCollapsibleTrigger,
	Panel: DaisyCollapsiblePanel,
	Content: DaisyCollapsiblePanel, // Backward compatibility alias
} as const;
