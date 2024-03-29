import type { CSSProperties } from 'react';
import React from 'react';
import classNames from 'classnames';
import { DotsFadeLoader } from './DotsFadeLoader/DotsFadeLoader';

export const LoadingIndicator: React.FC<{ title?: string; className?: string; style?: CSSProperties }> = ({
  title,
  className,
  style,
}) => {
  return (
    <div
      className={classNames('relative flex min-h-[inherit] h-full w-full items-center justify-center', className)}
      style={style}
    >
      <DotsFadeLoader />
    </div>
  );
};
