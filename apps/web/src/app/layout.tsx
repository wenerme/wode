import React from 'react';
import './globals.css';
import { NextRootLayout } from '@/app/NextRootLayout';
import type { NextLayoutProps } from '@/types';

export default async function RootLayout({ children, params }: NextLayoutProps) {
  return <NextRootLayout params={params}>{children}</NextRootLayout>;
}
