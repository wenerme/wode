import React, { type FC, type PropsWithChildren } from 'react';
import { usePromise } from '@wener/reaction';
import { NonIdealState } from '../../daisy';
import { resolveErrorMessage } from '../../toast';
import { LoadingIndicator } from '../components';
import { getUserStore } from '../context';
import type { UserProfileData } from '../store/UserStore';

export const UserLoader: FC<
  PropsWithChildren & {
    load?: () => Promise<UserProfileData>;
  }
> = ({ children, load }) => {
  const { loading, error } = usePromise(async () => {
    if (!load) return;
    let data = await load();
    data && getUserStore().getState().load(data);
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <NonIdealState title={'Failed to load user'} description={String(resolveErrorMessage(error))} />;
  }

  return children;
};
