'use server';

import type { FC } from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ServerOnly: FC<AlternativeRendererProps> = (props) => {
	let isServer = typeof window === 'undefined';
	return renderAlternative(isServer, props);
};
