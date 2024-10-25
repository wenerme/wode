import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { flexRender, useControllable, type FlexRenderable } from '@wener/reaction';
import { clsx } from 'clsx';
import { cn } from '../../tw/cn';

export interface TitleTabItem {
  label: ReactNode;
  href?: string;
  icon?: FlexRenderable<any>;
  action?: ReactNode;
  key?: string;
}

export function getTitleTabItemKey(item: TitleTabItem, index: number) {
  return item.key ?? String(index);
}

export const TitleTabList = forwardRef<
  HTMLDivElement,
  Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
    title?: ReactNode;
    action?: ReactNode;
    tabs: Array<TitleTabItem>;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  }
>(({ className, value, onValueChange, defaultValue, title, action, tabs, ...props }, ref) => {
  const [current, setCurrent] = useControllable<string>(value, onValueChange, defaultValue);
  return (
    <div ref={ref} className={cn('flex items-end', className)} {...props}>
      <div
        className={'border-color flex h-full items-center px-2'}
        style={{
          // border-b-[--tab-border]  not works
          borderBottomWidth: 'var(--tab-border,1px)',
        }}
      >
        <h3 className={'text-lg font-medium'}>{title}</h3>
      </div>
      <div role='tablist' className='tabs tabs-lifted tabs-sm'>
        {tabs.map((item, index) => {
          const { label, href, icon } = item;
          const key = getTitleTabItemKey(item, index);
          const content = (
            <>
              {flexRender(icon, { className: 'w-4 h-4' })}
              {label}
            </>
          );
          let isActive = key === current;
          return href ? (
            <NavLink
              to={href}
              role='tab'
              className={({ isActive }) => clsx('tab', isActive && 'tab-active')}
              key={index}
            >
              {content}
            </NavLink>
          ) : (
            <a
              role='tab'
              className={clsx('tab', isActive && 'tab-active')}
              key={index}
              onClick={() => {
                setCurrent(key);
              }}
            >
              {content}
            </a>
          );
        })}
      </div>
      <div
        className={'border-color flex-1 border-b'}
        style={{
          // border-b-[--tab-border]  not works
          borderBottomWidth: 'var(--tab-border,1px)',
        }}
      ></div>
      {action && (
        <div
          className={'border-color flex items-center self-stretch border-b pr-1'}
          style={{
            borderBottomWidth: 'var(--tab-border,1px)',
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
});
