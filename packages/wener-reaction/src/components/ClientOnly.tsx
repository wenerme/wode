import type { FC } from 'react';
import { renderAlternative, type AlternativeRendererProps } from '../render/renderAlternative';

export const ClientOnly: FC<AlternativeRendererProps> = (props) => {
  return renderAlternative(typeof window !== 'undefined', props);
};
