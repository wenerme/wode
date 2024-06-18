import React from 'react';
import { AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ClientOnly: React.FC<AlternativeRendererProps> = (props) => {
  return renderAlternative(typeof window !== 'undefined', props);
};
