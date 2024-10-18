import { arrayOfMaybeArray } from '@wener/utils';
import { HomePage } from '@/components/home/HomePage';
import { PageLayout } from '@/components/page/PageLayout';
import { getSiteData } from '@/data/getSiteData';
import { getLocales } from '@/i18n/getLocales';
import { loadI18n } from '@/i18n/loadI18n';
import type { NextPageProps } from '@/types';

export default async function (props: NextPageProps) {
  const tags = arrayOfMaybeArray(props.searchParams.tags)
    ?.flat()
    .join(',')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);
  const { locales } = getLocales();

  const { url } = getSiteData();
  const { i18n } = await loadI18n();
  return (
    <>
      <>
        <meta httpEquiv={'content-language'} content={i18n.locale} />
        <link rel='canonical' href={url} />
        <link rel='alternate' href={url} hrefLang={'x-default'} type='text/html' />
        {locales.map((v) => {
          return <link key={v} rel='alternate' href={`${url}/?lang=${v}`} hrefLang={v} type='text/html' />;
        })}
      </>
      <PageLayout {...props}>
        <HomePage tags={tags} />
      </PageLayout>
    </>
  );
}
