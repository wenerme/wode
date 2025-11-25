import React, { useCallback, type ReactNode } from 'react';
import { LoadingIndicator } from '../../console';
import { AuthStatus, useAuthStore } from './AuthStore';

export const AuthReady = ({ children }: { children?: ReactNode }) => {
	const ready = useAuthStore(useCallback((s) => s.status !== AuthStatus.Init, []));
	if (ready) {
		return children;
	}
	return <LoadingIndicator />;
};
