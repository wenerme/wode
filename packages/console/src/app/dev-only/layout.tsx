'use client';

import React from 'react';
import { MountedOnly } from '@wener/reaction';
import { DevOnly } from '@/app/dev-only/DevOnly';
import type { NextLayoutProps } from '@/types';

export default function DevOnlyLayout({ children }: NextLayoutProps) {
  return (
    <DevOnly fallback={<h2>Dev Only</h2>}>
      <MountedOnly>{children}</MountedOnly>
    </DevOnly>
  );
}
