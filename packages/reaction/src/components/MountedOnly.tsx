'use client';

import React from 'react';
import { useMounted } from '../hooks/useMounted';
import { AlternativeRendererProps, renderAlternative } from '../render/renderAlternative';

/**
 * Only render when mounted or client side
 */
export const MountedOnly: React.FC<AlternativeRendererProps> = (props) => {
  const mounted = useMounted();
  return renderAlternative(mounted, props);
};
