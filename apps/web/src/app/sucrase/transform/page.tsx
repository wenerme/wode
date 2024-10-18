import React from 'react';
import { SucraseTransformPage } from '@/app/sucrase/transform/SucraseTransformPage';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
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
