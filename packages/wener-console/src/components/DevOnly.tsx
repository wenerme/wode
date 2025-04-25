import type { PropsWithChildren, ReactNode } from 'react';
import { isDevelopment } from 'std-env';

export const DevOnly = ({ children }: PropsWithChildren): ReactNode => {
	if (isDevelopment) {
		return children;
	}
	return null;
};
