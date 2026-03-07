import type { BoundedUseStore } from '@wener/reaction/zustand';
import type { ReactNode } from 'react';
import { AuthBlock, AuthReady, AuthSidecar } from '../../../foundation/auth';
import {
	type AuthStore,
	AuthStoreContext,
	createAuthStore,
	useAuthStore,
	useAuthStoreContext,
} from '../../../foundation/auth/AuthStore';

export namespace ConsoleAuth {
	export const Block = AuthBlock;
	export const Ready = AuthReady;
	export const Root = ({ children, value }: { children?: ReactNode; value?: AuthStore }) => {
		return <AuthStoreContext value={value}>{children}</AuthStoreContext>;
	};
	export type Store = AuthStore;
	export const Sidecar = AuthSidecar;
	export const useContext = useAuthStoreContext;
	export const useStore: BoundedUseStore<AuthStore> = useAuthStore;
	export const createStore = createAuthStore;
}
