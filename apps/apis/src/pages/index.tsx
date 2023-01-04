import React from 'react';
import { ErrorSuspenseBoundary } from '@wener/reaction';
import WenerApisApp from '../components/WenerApisApp';

const CurrentPage = () => {
  return (
    <ErrorSuspenseBoundary>
      <WenerApisApp />
    </ErrorSuspenseBoundary>
  );
};
export default CurrentPage;
