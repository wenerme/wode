import { useTranslation } from '../i18n/server';
import {unstable_cache} from 'next/server'

const CurrentPage = async ({ params }: { params: { lang: string } }) => {
  const { t } = await useTranslation(params.lang);
  return <div>
    {String(t('hello'))}
  </div>;
};
export default CurrentPage;

