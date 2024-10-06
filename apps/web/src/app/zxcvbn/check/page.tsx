import { firstOfMaybeArray } from '@wener/utils';
import type { ZXCVBNResult } from 'zxcvbn';
import { PageContainer } from '@/components/pages/PageContainer';
import { PageLayout } from '@/components/pages/PageLayout';
import { ZxcvbnPasswordStrength } from '@/components/zxcvbn/ZxcvbnPasswordStrength';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  const password = firstOfMaybeArray(props.searchParams.password);
  let data: ZXCVBNResult | undefined;
  if (password && typeof password === 'string') {
    const { default: check } = await import('zxcvbn');
    data = check(password);
  }
  return (
    <PageLayout>
      <PageContainer>
        <ZxcvbnPasswordStrength password={password} data={data} />
      </PageContainer>
    </PageLayout>
  );
}
