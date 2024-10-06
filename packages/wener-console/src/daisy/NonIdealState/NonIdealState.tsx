import type { HTMLAttributes } from 'react';
import type React from 'react';
import classNames from 'clsx';
import type { IntentType } from '../const';

export interface NonIdealStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  intent?: IntentType;
}

export const NonIdealState: React.FC<NonIdealStateProps> = ({
  icon,
  title,
  description,
  action,
  children,
  className,
  intent,
  ...props
}) => {
  return (
    <div
      className={classNames('NonIdealState flex h-full w-full flex-col items-center justify-center', className)}
      {...props}
    >
      <div className={classNames('text-lg opacity-75 [&>svg]:w-[4rem]', intent && `text-${intent}`)}>{icon}</div>
      {title && <h4 className={'pb-2 text-2xl font-bold opacity-80'}>{title}</h4>}
      {description && <div className={'pb-4 opacity-75'}>{description}</div>}
      {action}
      {children}
    </div>
  );
};
