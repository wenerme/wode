import React, { type ComponentPropsWithoutRef, type FC } from 'react';
import { HiExclamationCircle } from 'react-icons/hi2';
import { showErrorToast } from '../toast';
import { cn } from '../tw';

export const ErrorPlaceholder: FC<{ error: any } & ComponentPropsWithoutRef<'div'>> = ({
  error,
  className,
  ...props
}) => {
  if (!error) {
    return null;
  }
  return (
    <div
      role={'button'}
      className={cn('btn btn-square btn-ghost btn-xs flex items-center text-warning', className)}
      {...props}
      onClick={() => {
        showErrorToast(error);
      }}
    >
      <HiExclamationCircle className={'h-4 w-4'} />
    </div>
  );
};
