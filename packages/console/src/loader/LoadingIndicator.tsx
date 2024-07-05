import type { CSSProperties } from 'react';
import React from 'react';
import clsx from 'clsx';
import { DotsFadeLoader } from './DotsFadeLoader/DotsFadeLoader';

export const LoadingIndicator: React.FC<{ title?: string; className?: string; style?: CSSProperties }> = ({
  title,
  className,
  style,
}) => {
  return (
    <div
      className={clsx('relative flex h-full min-h-[inherit] w-full items-center justify-center', className)}
      style={style}
    >
      <DotsFadeLoader />
    </div>
  );
};
