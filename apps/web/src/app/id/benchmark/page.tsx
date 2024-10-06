import { IdBenchmarkPage } from '@/app/id/benchmark/IdBenchmarkPage';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';

export default function () {
  return (
    <PageLayout>
      <PageContainer>
        <IdBenchmarkPage />
      </PageContainer>
    </PageLayout>
  );
}
