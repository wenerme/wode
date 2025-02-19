import React, { useEffect, useState, type PropsWithChildren } from 'react';
import { AuthStatus, getAuthStore, useAuthStore } from './AuthStore';

export const AuthBlock: React.FC<
	PropsWithChildren & {
		fallback?: React.ReactNode;
		pending?: React.ReactNode;
	}
> = ({ children, fallback, pending }) => {
	const { authed, init } = useAuthBlock();
	if (!init) {
		return pending;
	}
	if (!authed) {
		return fallback;
	}
	return <>{children}</>;
};

function useAuthBlock() {
	let store = getAuthStore();
	const [authed, setAuthed] = useState(() => {
		return store.getState().status === AuthStatus.Authenticated;
	});
	const init = useAuthStore((s) => s.status === 'Init');
	useEffect(() => {
		// avoid authed state change
		let unsub = store.subscribe((s) => {
			if (s.status === AuthStatus.Authenticated) {
				setAuthed(true);
			} else if (s.status === AuthStatus.Unauthenticated) {
				setAuthed(false);
			}
		});
		return unsub;
	}, []);

	return {
		authed,
		init,
	};
}
