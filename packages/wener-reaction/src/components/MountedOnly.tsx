'use client';

import type { FC } from 'react';
import { useMounted } from '../hooks/useMounted';
import { renderAlternative, type AlternativeRendererProps } from '../render/renderAlternative';

/**
 * Only render when mounted or client side
 */
export const MountedOnly: FC<AlternativeRendererProps> = (props) => {
  const mounted = useMounted();
  return renderAlternative(mounted, props);
};
