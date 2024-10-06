import type React from 'react';
import { useCallback, type ReactNode } from 'react';
import { LoadingIndicator } from '@wener/console/console';
import { useStore } from 'zustand';
import { AuthStatus, useAuthStore } from '@/foundation/Auth/AuthStore';

export const AuthReady: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const ready = useStore(
    useAuthStore(),
    useCallback((s) => s.status !== AuthStatus.Init, []),
  );
  if (ready) {
    return children;
  }
  return <LoadingIndicator />;
};
