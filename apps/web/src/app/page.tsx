import { arrayOfMaybeArray } from '@wener/utils';
import { HomePage } from '@/components/home/HomePage';
import { PageLayout } from '@/components/pages/PageLayout';
import type { NextPageProps } from '@/types';

export default function (props: NextPageProps) {
  const tags = arrayOfMaybeArray(props.searchParams.tags)
    ?.flat()
    .join(',')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);
  return (
    <PageLayout>
      <HomePage tags={tags} />
    </PageLayout>
  );
}
