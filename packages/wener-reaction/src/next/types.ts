import type { ReactNode } from 'react';

export interface NextPageProps<P = Record<string, any>, S = Record<string, any>> {
  params: P;
  searchParams: S;
}

export interface NextLayoutProps<P = Record<string, any>> {
  params: P;
  children?: ReactNode;
}
