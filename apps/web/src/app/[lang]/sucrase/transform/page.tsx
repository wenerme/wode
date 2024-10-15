import React from 'react';
import { SucraseTransformPage } from '@/app/[lang]/sucrase/transform/SucraseTransformPage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer>
        <SucraseTransformPage />
      </PageContainer>
    </PageLayout>
  );
}
