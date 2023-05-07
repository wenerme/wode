import { useTranslation } from '../i18n/server';
import { HomePage } from '../../components/HomePage';
import { withTranslation } from '../i18n';

const CurrentPage = async ({ params }: { params: { lang: string } }) => {
  const r = await useTranslation(params.lang);
  withTranslation(() => r, params.lang);
  return <HomePage />;
};
export default CurrentPage;

