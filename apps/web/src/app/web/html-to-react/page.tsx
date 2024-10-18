import React from 'react';
import { HtmlToReactPage } from '@/app/web/html-to-react/HtmlToReactPage';
import { PageContainer } from '@/components/page/PageContainer';
import { PageLayout } from '@/components/page/PageLayout';
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
