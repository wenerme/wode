import type { ReactNode } from 'react';
import { AuthBlock, AuthReady, AuthSidecar } from '../../../foundation/auth';
import type { AuthStore } from '../../../foundation/auth/AuthStore';

export namespace ConsoleAuth {
	export const Block = AuthBlock;
	export const Ready = AuthReady;
	export const Root = ({ children }: { children?: ReactNode }) => {
		return <>{children}</>;
	};
	export type Store = AuthStore;
	export const Sidecar = AuthSidecar;
}
