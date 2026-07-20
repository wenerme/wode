import type { FC } from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const DevOnly: FC<AlternativeRendererProps> = (props) => {
	const dev = process.env.NODE_ENV === 'development';
	return renderAlternative(dev, props);
};
