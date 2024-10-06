import type React from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ProdOnly: React.FC<AlternativeRendererProps> = (props) => {
  const dev = process.env.NODE_ENV === 'production';
  return renderAlternative(dev, props);
};
