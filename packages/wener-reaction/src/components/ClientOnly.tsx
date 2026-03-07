import type { FC } from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ClientOnly: FC<AlternativeRendererProps> = (props) => {
	return renderAlternative(typeof window !== 'undefined', props);
};
