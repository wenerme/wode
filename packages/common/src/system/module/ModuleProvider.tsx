import React, { type ReactNode, useEffect, useState } from 'react';
import { LoadingIndicator } from '../../components';
import { type DynamicModuleLoader } from './Module';
import { loadModules } from './loadModules';

export const ModuleProvider: React.FC<{ children?: ReactNode; loader: DynamicModuleLoader }> = ({
  children,
  loader,
}) => {
  const [init, setInit] = useState(false);
  useEffect(() => {
    loadModules({ loader }).then(() => {
      setInit(true);
    });
  }, []);
  if (!init) {
    return <LoadingIndicator />;
  }
  return <>{children}</>;
};
