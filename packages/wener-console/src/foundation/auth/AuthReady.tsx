import React, { useCallback, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { LoadingIndicator } from '../../console';
import { AuthStatus, getAuthStore } from './AuthStore';

export const AuthReady: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const ready = useStore(
    getAuthStore(),
    useCallback((s) => s.status !== AuthStatus.Init, []),
  );
  if (ready) {
    return children;
  }
  return <LoadingIndicator />;
};
