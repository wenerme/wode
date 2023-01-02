import React from 'react';
import { ImLab } from 'react-icons/im';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { getBuildInfo } from './getBuildInfo';

export const BuildVersion: React.FC<React.HTMLProps<HTMLSpanElement>> = ({ className, ...props }) => {
  const { version, isDev, date } = getBuildInfo();
  return (
    <>
      <span className={classNames('opacity-70 flex items-baseline', className)} {...props}>
        v{version}
        {date && <small>.{dayjs(date).format('HHmm')}</small>}
        {isDev && (
          <>
            <ImLab className={'text-warning'} />
          </>
        )}
      </span>
    </>
  );
};
