import { type ReactNode } from 'react';
import { isProduction } from 'std-env';

export const ProdOnly = ({ children }: { children?: ReactNode }): ReactNode => {
	if (isProduction) {
		return children;
	}
	return null;
};
