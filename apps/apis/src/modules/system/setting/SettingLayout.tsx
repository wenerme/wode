import type { HTMLProps } from 'react';
import React from 'react';
import classNames from 'classnames';

export const SettingLayout: React.FC<
  { title?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode } & Omit<
    HTMLProps<HTMLDivElement>,
    'title' | 'action'
  >
> = ({ title, children, className, action, ...props }) => {
  return (
    <div className={classNames('flex w-full h-full flex-col', className)} {...props}>
      <h3 className={'flex items-center gap-4 p-2 text-lg font-medium'}>
        {title}
        <div className={'flex-1'} />
        {action}
      </h3>
      <hr />
      <div className={'relative flex flex-1 flex-col flex-wrap gap-1 p-2'}>{children}</div>
    </div>
  );
};
