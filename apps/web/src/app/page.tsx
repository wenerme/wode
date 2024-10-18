import { arrayOfMaybeArray } from '@wener/utils';
import { HomePage } from '@/components/home/HomePage';
import { PageLayout } from '@/components/page/PageLayout';
import { getLocales } from '@/i18n/getLocales';
import type { NextPageProps } from '@/types';

export default function (props: NextPageProps) {
  const tags = arrayOfMaybeArray(props.searchParams.tags)
    ?.flat()
    .join(',')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);
  const { locales } = getLocales();

  return (
    <>
      {locales.map((v) => {
        return <link key={v} rel='alternate' href={`/?lang=${v}`} hrefLang={v} type='text/html' />;
      })}
      <PageLayout {...props}>
        <HomePage tags={tags} />
      </PageLayout>
    </>
  );
}
