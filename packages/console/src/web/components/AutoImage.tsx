import React, { forwardRef } from 'react';
import NextImage, { ImageProps } from 'next/image';
import { useIsNextJS } from '@/web/hooks';

export const AutoImage = forwardRef<any, ImageProps>(({ src, ...props }, ref) => {
  if (useIsNextJS()) {
    return <NextImage src={src} {...props} ref={ref} />;
  }

  // maybe nextjs image object
  if (typeof src === 'object') {
    if ('src' in src) {
      src = src.src;
    } else {
      src = src.default.src;
    }
  }
  return <img src={src} {...props} ref={ref} />;
});
