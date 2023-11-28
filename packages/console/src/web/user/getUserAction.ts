import { MaybePromise } from '@wener/utils';
import { getLogger } from '../../components/hooks';
import { showSuccessToast } from '../../components/toast';
import { getUserProfileState } from './getUserProfileState';
import { getUserSessionState } from './getUserSessionState';

const log = getLogger('UserAction');

const DefaultUserAction: UserAction = {
  refreshProfile: () => {
    showSuccessToast('UserAction: refreshProfile');
  },
  lock: () => {
    getUserSessionState().locked = true;
  },
  unlock: () => {
    getUserSessionState().locked = false;
  },
  signOut: async () => {
    log.info(`FAKE sign out`);
    Object.assign(getUserSessionState(), {
      authed: false,
      token: undefined,
    });
    Object.assign(getUserProfileState(), {
      id: undefined,
      loginName: '',
      fullName: '',
      displayName: '',
      hasNotification: false,
    });
  },
  signIn: async () => {
    showSuccessToast('FAKE sign in');

    Object.assign(getUserProfileState(), {
      id: 'FAKE',
      loginName: 'wenerme',
      fullName: '文儿',
      displayName: 'Wener',
      hasNotification: true,
    });
    Object.assign(getUserSessionState(), {
      authed: true,
      token: 'TOKEN',
    });
  },
};

export function getUserAction(): UserAction {
  return DefaultUserAction;
}

export function setUserAction(action: Partial<UserAction>) {
  Object.assign(DefaultUserAction, action);
}

export interface UserAction {
  refreshProfile: () => MaybePromise<void>;
  signIn: () => MaybePromise<void>;
  signOut: () => MaybePromise<void>;
  lock: () => MaybePromise<void>;
  unlock: () => MaybePromise<void>;
}
