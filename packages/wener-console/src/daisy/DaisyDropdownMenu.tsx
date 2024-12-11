import React, { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@wener/console';
import { flexRender } from '@wener/reaction';
import type { FlexRenderable } from '@wener/reaction';
import { clsx } from 'clsx';
import { pick } from 'es-toolkit';
import { match } from 'ts-pattern';
import { isNodeTypeOf } from './isNodeTypeOf';

export namespace DaisyDropdownMenu {
  export type MenuItem =
    | ({
        type?: 'item';
        label?: ReactNode;
        icon?: FlexRenderable<any>;
      } & ComponentPropsWithoutRef<typeof DropdownMenu.Item>)
    | ({ type: 'label'; label?: ReactNode } & ComponentPropsWithoutRef<typeof DropdownMenu.Label>)
    | ({ type: 'separator' } & ComponentPropsWithoutRef<typeof DropdownMenu.Separator>);
  type CompositeProps = {
    items: MenuItem[];
    children?: ReactNode;
    trigger?: ReactNode;
    portal?: boolean;

    // root
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?(open: boolean): void;
    modal?: boolean;
    //
    className?: string;
  };
  export const Composite = ({ items, children, trigger, portal, className, ...props }: CompositeProps) => {
    // if (Children.count(children) === 1) {
    //   children = Children.only(children);
    // }
    trigger ||= children;
    if (trigger) {
      if (!isNodeTypeOf(trigger, [DropdownMenu.Trigger, Trigger])) {
        let last = trigger;
        trigger = <Trigger asChild>{last}</Trigger>;
      }
    }
    let content = (
      <DropdownMenu.Content
        side={'bottom'}
        align={'end'}
        sideOffset={5}
        className={cn('menu menu-sm z-30 w-52 rounded-box bg-base-200', className)}
      >
        {items.map((item, key) => {
          return match(item)
            .with({ type: 'label' }, ({ label, type, className, children, ...props }) => {
              return (
                <DropdownMenu.Label key={key} className={cn('menu-title', className)} {...props}>
                  {label || children}
                </DropdownMenu.Label>
              );
            })
            .with({ type: 'separator' }, ({ type, className, ...props }) => {
              return (
                <DropdownMenu.Separator key={key} className={cn('m-[5px] h-px bg-base-300', className)} {...props} />
              );
            })
            .otherwise(({ label, icon, type, className, children, ...props }) => {
              return (
                <DropdownMenu.Item key={key} asChild {...props}>
                  <li
                    className={clsx(
                      'select-none outline-none',
                      'group/item',
                      'data-[disabled]:disabled data-[disabled]:pointer-events-none',
                      className,
                    )}
                  >
                    <a className={clsx('group-data-[highlighted]/item:active')}>
                      {flexRender(icon, { className: 'size-4' })}
                      {label}
                    </a>
                  </li>
                </DropdownMenu.Item>
              );
            });
        })}
      </DropdownMenu.Content>
    );

    return (
      <DropdownMenu.Root {...pick(props, ['open', 'onOpenChange', 'modal', 'defaultOpen'])}>
        {trigger}
        {portal && <DropdownMenu.Portal>{content}</DropdownMenu.Portal>}
        {!portal && content}
      </DropdownMenu.Root>
    );
  };

  export interface TriggerProps extends DropdownMenu.DropdownMenuTriggerProps {}

  export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(({ className, ...props }, ref) => {
    return <DropdownMenu.Trigger className={cn('btn relative', className)} {...props} ref={ref} />;
  });
}
