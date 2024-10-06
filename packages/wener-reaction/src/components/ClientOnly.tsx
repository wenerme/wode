import type React from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ClientOnly: React.FC<AlternativeRendererProps> = (props) => {
  return renderAlternative(typeof window !== 'undefined', props);
};
