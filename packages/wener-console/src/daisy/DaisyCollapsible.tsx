import { Collapsible } from '@base-ui/react/collapsible';
import { cn } from '@wener/console';
import type React from 'react';
import type { FC } from 'react';

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

type DaisyCollapsibleComponents = {
	Root: typeof DaisyCollapsibleRoot;
	Trigger: typeof DaisyCollapsibleTrigger;
	Panel: typeof DaisyCollapsiblePanel;
	Content: typeof DaisyCollapsiblePanel;
};

export const DaisyCollapsible: DaisyCollapsibleComponents = {
	Root: DaisyCollapsibleRoot,
	Trigger: DaisyCollapsibleTrigger,
	Panel: DaisyCollapsiblePanel,
	Content: DaisyCollapsiblePanel, // Backward compatibility alias
};
