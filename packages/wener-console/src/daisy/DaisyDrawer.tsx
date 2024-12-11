import React, { forwardRef, type FC } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@wener/console';

export namespace DaisyDrawer {
  export const Trigger = Dialog.Trigger;
  export const Root = Dialog.Root;
  export const Portal = Dialog.Portal;
  type OverlayProps = Dialog.DialogOverlayProps & {};
  export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(({ children, className, ...props }, ref) => {
    return (
      <Dialog.Overlay className={'fixed inset-0 z-30 bg-base-300 opacity-75'} ref={ref} {...props}>
        {children}
      </Dialog.Overlay>
    );
  });
  export type ContentProps = Dialog.DialogContentProps & {};
  export const Content: FC<ContentProps> = ({ className, children, ...props }) => {
    return (
      <Dialog.Content className={cn('fixed right-0 z-30 h-full w-56 border-l bg-base-100', className)} {...props}>
        {children}
      </Dialog.Content>
    );
  };

  type TitleProps = Dialog.DialogTitleProps & {};
  export const Title = forwardRef<HTMLDivElement, TitleProps>(({ children, className, ...props }, ref) => {
    return (
      <Dialog.Title className={cn(className, 'p-2 text-lg font-medium')} {...props} ref={ref}>
        {children}
      </Dialog.Title>
    );
  });

  type DescriptionProps = Dialog.DialogDescriptionProps & {};
  export const Description = forwardRef<HTMLDivElement, DescriptionProps>(({ children, ...props }, ref) => {
    return (
      <Dialog.Description {...props} ref={ref}>
        {children}
      </Dialog.Description>
    );
  });
}
