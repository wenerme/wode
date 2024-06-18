'use server';

import React from 'react';
import { AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

export const ServerOnly: React.FC<AlternativeRendererProps> = (props) => {
  let isServer = typeof window === 'undefined';
  return renderAlternative(isServer, props);
};
