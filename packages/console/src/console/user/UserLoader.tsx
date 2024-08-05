import { PropsWithChildren } from 'react';
import { usePromise } from '@wener/reaction';
import { NonIdealState } from '../../daisy';
import { resolveErrorMessage } from '../../toast';
import { LoadingIndicator } from '../components';
import { getUserStore } from '../container';
import { UserProfileData } from '../UserStore';

export const UserLoader: React.FC<
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
