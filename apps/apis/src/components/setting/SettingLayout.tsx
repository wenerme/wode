import type { HTMLProps } from 'react';
import React from 'react';
import classNames from 'classnames';

export const SettingLayout: React.FC<
  { title?: React.ReactNode; children?: React.ReactNode } & HTMLProps<HTMLDivElement>
> = ({ title, children, className, ...props }) => {
  return (
    <div className={classNames('flex w-full flex-col p-4', className)} {...props}>
      <h3 className={'flex items-center gap-4 p-2 text-lg font-medium'}>{title}</h3>
      <hr />
      <div className={'relative flex flex-1 flex-col flex-wrap gap-1 p-2'}>{children}</div>
    </div>
  );
};
