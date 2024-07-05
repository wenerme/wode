import type { HTMLProps } from 'react';
import React from 'react';
import { clsx } from 'clsx';
import { cn } from '@/lib/utils';
import { TitleTabLayout } from '@/web/components/TitleTabLayout';

export const SettingLayout: React.FC<
  { title?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode } & Omit<
    HTMLProps<HTMLDivElement>,
    'title' | 'action'
  >
> = ({ title, children, className, action, ...props }) => {
  return (
    <TitleTabLayout title={title || '设置'} tabs={[]} className={cn('h-full', className)} action={action} {...props}>
      {children}
    </TitleTabLayout>
  );
  return (
    <div className={clsx('flex h-full w-full flex-col', className)} {...props}>
      <h3 className={'flex items-center gap-4 p-2 text-lg font-medium'}>
        {title}
        <div className={'flex-1'} />
        {action}
      </h3>
      <hr className={'border-color'} />
      <div className={'relative flex flex-1 flex-col flex-wrap gap-1 p-2'}>{children}</div>
    </div>
  );
};
