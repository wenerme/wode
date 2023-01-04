import React from 'react';
import { useMounted } from '@wener/reaction';

const Content = React.lazy(() => import('../components/WenerApisApp'));
const CurrentPage = () => {
  const ok = useMounted();
  if (!ok) {
    return null;
  }
  return (
    <>
      <Content />
    </>
  );
};
export default CurrentPage;
