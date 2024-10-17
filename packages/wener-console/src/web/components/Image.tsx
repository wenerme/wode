import { forwardRef, type ComponentPropsWithoutRef } from 'react';

export type ImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'src'> & {
  src: string | StaticImport;
};

type StaticImport = StaticRequire | StaticImageData;

interface StaticRequire {
  default: StaticImageData;
}

interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(({ src, ...props }, ref) => {
  // if (useIsNextJS()) {
  //   return <NextImage src={src} {...props} ref={ref} />;
  // }

  // maybe nextjs image object
  if (src && typeof src === 'object') {
    if ('src' in src) {
      src = src.src;
    } else {
      src = src.default.src;
    }
  }
  if (typeof src === 'string') {
    return <img src={src} {...props} ref={ref} />;
  }
  return null;
});
