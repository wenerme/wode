import type React from 'react';
import type { MaybePromise } from '@wener/utils';

export interface NextPageProps<P = Record<string, any>, S = Record<string, any>> {
  params: P;
  searchParams: MaybePromise<S>;
}

export interface NextLayoutProps<P = Record<string, any>> {
  params: MaybePromise<P>;
  children?: React.ReactNode;
}
