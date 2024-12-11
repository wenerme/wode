import React, { forwardRef, Fragment, type ReactNode } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@wener/console';
import { Daisy } from '@wener/console/daisy';
import { flexRender, type FlexRenderable } from '@wener/reaction';
import { isNodeTypeOf } from './isNodeTypeOf';

export namespace DaisyTabs {
  export type CompositeProps = Omit<RootProps, 'content' | 'title'> & {
    ref?: React.Ref<HTMLDivElement>;
    list?: ReactNode;
    // content?:ReactNode
    tabs?: Array<{
      label?: ReactNode;
      trigger?: ReactNode;
      key?: string;
      href?: string;
      icon?: FlexRenderable<any>;
      action?: ReactNode;
      content?: ReactNode;
      asChild?: boolean;
    }>;
    renderList?: (props: { children: ReactNode }) => ReactNode;
    renderContent?: (props: { children: ReactNode }) => ReactNode;
  } & Pick<ListProps, 'size' | 'variant' | 'title' | 'action'>;

  export const Composite = ({
    children,
    renderContent = (props) => props.children,
    renderList = (props) => props.children,
    tabs = [],
    list,
    size,
    variant,
    title,
    action,
    ref,
    ...props
  }: CompositeProps) => {
    if (!list) {
      list = (
        <List {...{ size, variant, title, action }}>
          {tabs.map((item, index) => {
            const { label, href, icon } = item;
            const key = item.key ?? String(index);
            const Tag = item.href ? 'a' : 'button';
            let trigger: ReactNode;

            if (isNodeTypeOf(item.trigger, [Trigger, Tabs.Trigger])) {
              trigger = item.trigger;
            } else if (item.trigger) {
              trigger = (
                <Trigger key={key} value={key} asChild>
                  {item.trigger}
                </Trigger>
              );
            } else if (item.href) {
              trigger = (
                <Trigger key={key} value={key} asChild>
                  <Tag href={href}>
                    {flexRender(icon, {})}
                    {label}
                  </Tag>
                </Trigger>
              );
            } else {
              trigger = (
                <Trigger key={key} value={key}>
                  {flexRender(icon, {})}
                  {label}
                </Trigger>
              );
            }

            return trigger;
          })}
        </List>
      );
    }
    let hasContent = tabs.some((v) => v.content);
    let content: ReactNode = null;
    if (hasContent) {
      content = (
        <Fragment>
          {tabs.map((item, index) => {
            const key = item.key ?? String(index);
            let c = isNodeTypeOf(item.content, [Content, Tabs.Content]) ? (
              item.content
            ) : (
              <Content key={index} asChild={item.asChild} value={key || String(index)}>
                {item.content}
              </Content>
            );
            return c;
          })}
        </Fragment>
      );
    }
    return (
      <Root {...props} ref={ref}>
        {renderList({ children: list })}
        {children}
        {renderContent({ children: content })}
      </Root>
    );
  };

  export interface RootProps extends Tabs.TabsProps {}

  export const Root = forwardRef<HTMLDivElement, RootProps>(({ className, ...props }, ref) => {
    return <Tabs.Root className={cn('flex flex-col', className)} {...props} ref={ref} />;
  });

  export interface ContentProps extends Tabs.TabsContentProps {}

  export const Content = forwardRef<HTMLDivElement, ContentProps>(({ className, ...props }, ref) => {
    return <Tabs.Content className={cn('data-[state=inactive]:hidden', className)} {...props} ref={ref} />;
  });

  export interface ListProps extends Omit<Tabs.TabsListProps, 'title'> {
    size?: Daisy.SizeType;
    variant?: 'boxed' | 'bordered' | 'lifted';
    action?: React.ReactNode;
    title?: React.ReactNode;
  }

  export const List = forwardRef<HTMLDivElement, ListProps>(
    ({ className, variant, size, action, title, children, ...props }, ref) => {
      const sz = Daisy.getSize(size);

      return (
        <Tabs.List
          className={cn('flex', 'data-[variant=boxed]:self-center')}
          data-variant={variant}
          {...props}
          ref={ref}
        >
          {variant === 'lifted' && (
            <div
              className={'border-color flex h-full items-center self-end px-2'}
              style={{
                // border-b-[--tab-border]  not works
                borderBottomWidth: 'var(--tab-border,1px)',
              }}
            >
              <h3 className={'text-lg font-medium'}>{title}</h3>
            </div>
          )}
          <div
            className={cn(
              'tabs',
              variant === 'boxed' && 'tabs-boxed',
              variant === 'bordered' && 'tabs-bordered',
              variant === 'lifted' && 'tabs-lifted self-start',
              sz?.tabs,
              className,
            )}
          >
            {children}
          </div>
          {variant === 'lifted' && (
            <div
              className={'border-color flex-1 border-b'}
              style={{
                // border-b-[--tab-border]  not works
                borderBottomWidth: 'var(--tab-border,1px)',
              }}
            />
          )}
          {variant === 'lifted' && action && (
            <div
              className={'border-color flex items-center self-stretch border-b pr-1'}
              style={{
                borderBottomWidth: 'var(--tab-border,1px)',
              }}
            >
              {action}
            </div>
          )}
        </Tabs.List>
      );
    },
  );

  export interface TriggerProps extends Tabs.TabsTriggerProps {}

  export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(({ className, ...props }, ref) => {
    return (
      <Tabs.Trigger
        className={cn(
          //
          'tab',
          'data-[disabled]:tab-disabled',
          'data-[state=active]:tab-active',
          className,
        )}
        {...props}
        ref={ref}
      />
    );
  });
}
