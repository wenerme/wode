import { DashApp } from '../../modules/apis-dash';

const CurrentPage = ({ params }: { params: { slug: string[] | string | undefined } }) => {
  return <DashApp initialPath={Array.from(params.slug ?? '').join('/')} />;
};
export default CurrentPage;

