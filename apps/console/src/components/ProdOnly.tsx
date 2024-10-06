import type React from 'react';
import type { ReactNode } from 'react';
import { useIsProd } from '@/hooks/env';

export const ProdOnly: React.FC<{ children?: ReactNode; fallback?: ReactNode }> = ({ children, fallback = null }) => {
  return useIsProd() ? <>{children}</> : fallback;
};
