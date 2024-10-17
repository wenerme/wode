'use server';

import type { FC } from 'react';
import { renderAlternative, type AlternativeRendererProps } from '../render/renderAlternative';

export const ServerOnly: FC<AlternativeRendererProps> = (props) => {
  let isServer = typeof window === 'undefined';
  return renderAlternative(isServer, props);
};
