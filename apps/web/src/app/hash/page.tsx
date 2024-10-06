import { HashPage } from '@/components/hash/HashPage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  return (
    <PageLayout>
      <PageContainer>
        <HashPage />
      </PageContainer>
    </PageLayout>
  );
}
