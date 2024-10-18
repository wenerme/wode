import { arrayOfMaybeArray } from '@wener/utils';
import { HomePage } from '@/components/home/HomePage';
import { PageLayout } from '@/components/page/PageLayout';
import type { NextPageProps } from '@/types';

export default function (props: NextPageProps) {
  const tags = arrayOfMaybeArray(props.searchParams.tags)
    ?.flat()
    .join(',')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);
  return (
    <PageLayout {...props}>
      <HomePage tags={tags} />
    </PageLayout>
  );
}
