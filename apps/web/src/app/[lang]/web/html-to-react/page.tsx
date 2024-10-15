import React from 'react';
import { HtmlToReactPage } from '@/app/[lang]/web/html-to-react/HtmlToReactPage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer className={'py-2'}>
        <HtmlToReactPage />
      </PageContainer>
    </PageLayout>
  );
}
