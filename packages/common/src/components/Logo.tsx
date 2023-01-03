import type { HTMLProps } from 'react';
import React from 'react';
import classNames from 'classnames';

const LogoBgGradientBlue = 'bg-gradient-to-br from-green-300 via-blue-500 to-purple-600';

export const Logo: React.FC<HTMLProps<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={classNames(
        'flex items-center justify-center rounded-full inline-block p-2 w-8 h-8',
        LogoBgGradientBlue,
        className,
      )}
      {...props}
    >
      <div className={'text-white'}>企</div>
    </div>
  );
};
