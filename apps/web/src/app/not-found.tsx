'use client';

import React from 'react';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';

export default function ErrorPage() {
  return (
    <PageLayout>
      <PageContainer>
        <h2 className={'text-2xl font-bold'}>Not found</h2>
      </PageContainer>
    </PageLayout>
  );
}
