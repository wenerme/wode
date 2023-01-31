import React from 'react';
import { getBaseUrl } from 'common/src/runtime';

export const DevApiDocs: React.FC<{ url?: string }> = ({ url }) => {
  const u = new URL(`${getBaseUrl()}/docs.html`);
  if (url) {
    u.searchParams.set('url', url);
  }
  return <iframe className={'h-full w-full'} src={u.toString()} />;
};

export default DevApiDocs;
