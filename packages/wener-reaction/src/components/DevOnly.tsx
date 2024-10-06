import type React from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const DevOnly: React.FC<AlternativeRendererProps> = (props) => {
  const dev = process.env.NODE_ENV === 'development';
  return renderAlternative(dev, props);
};
