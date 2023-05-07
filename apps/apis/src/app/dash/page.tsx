import { DashApp } from '../../modules/dash-app';

const CurrentPage = ({ params }: { params: { slug: string[] | string | undefined } }) => {
  return <DashApp initialPath={Array.from(params.slug ?? '').join('/')} />;
};
export default CurrentPage;

