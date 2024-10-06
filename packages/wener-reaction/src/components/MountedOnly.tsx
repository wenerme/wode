'use client';

import type React from 'react';
import { useMounted } from '../hooks/useMounted';
import { type AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

/**
 * Only render when mounted or client side
 */
export const MountedOnly: React.FC<AlternativeRendererProps> = (props) => {
  const mounted = useMounted();
  return renderAlternative(mounted, props);
};
