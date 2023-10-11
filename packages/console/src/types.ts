import 'react';

export interface NextPageProps<P = Record<string, any>, S = Record<string, any>> {
  params: P;
  searchParams: S;
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
