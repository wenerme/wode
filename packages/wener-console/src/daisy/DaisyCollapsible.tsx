import React, { forwardRef, type FC } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { cn } from '@wener/console';

export namespace DaisyCollapsible {
  type RootProps = Collapsible.CollapsibleProps;

  export const Root: FC<RootProps> = ({ className, ...props }) => {
    return (
      <Collapsible.Root
        className={cn('collapse collapse-arrow rounded-none data-[state=open]:collapse-open', className)}
        {...props}
      />
    );
  };

  // export const Summary: FC<Collapsible.CollapsibleTriggerProps> = forwardRef(({ className, ...props },ref) => {
  //   return <Collapsible.Trigger className={cn('collapse-title border-b', className)} {...props} ref={ref} />;
  // });

  type TriggerProps = Collapsible.CollapsibleTriggerProps;

  export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(({ className, ...props }, ref) => {
    return <Collapsible.Trigger className={cn('', className)} {...props} ref={ref} />;
  });

  export const Content: FC<Collapsible.CollapsibleContentProps> = ({ className, ...props }) => {
    return <Collapsible.Content className={cn('collapse-content', className)} {...props} />;
  };
}
