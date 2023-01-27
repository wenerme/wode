import { getBaseUrl } from '../../runtime';

export const DevApiDocs = () => {
  return <iframe className={'h-full w-full'} src={`${getBaseUrl()}/docs.html`} />;
};

export default DevApiDocs;
