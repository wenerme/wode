import type { FC, ReactNode } from 'react';
import React from 'react';

export const DevOnly: FC<{ children?: ReactNode; fallback?: ReactNode }> = ({ children, fallback = null }) => {
  const dev = process.env.NODE_ENV === 'development';
  return dev ? <>{children}</> : fallback;
};
