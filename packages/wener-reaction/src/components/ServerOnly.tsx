'use server';

import type React from 'react';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ServerOnly: React.FC<AlternativeRendererProps> = (props) => {
  let isServer = typeof window === 'undefined';
  return renderAlternative(isServer, props);
};
