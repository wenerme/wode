'use client';

import React, { ReactNode } from 'react';
import { useMounted } from '../hooks/useMounted';

/**
 * Only render when mounted or client side
 */
export const MountedOnly: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const mounted = useMounted();
  if (!mounted) {
    return null;
  }
  return children;
};
