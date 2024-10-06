import type React from 'react';
import type { ReactNode } from 'react';

export const DevOnly: React.FC<{ children?: ReactNode; fallback?: ReactNode }> = ({ children, fallback = null }) => {
  const dev = process.env.NODE_ENV === 'development';
  return dev ? <>{children}</> : fallback;
};
