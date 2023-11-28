import { proxyWith } from '../../components/valtio';

export interface UserProfileState {
  id?: string;
  avatarUrl?: string;
  loginName?: string;
  fullName: string;
  displayName: string;
  hasNotification: boolean;
}

// export interface OrganizationProfileState {
//   displayName?: string;
//   fullName: string;
// }

export function getUserProfileState(): UserProfileState {
  return proxyWith({
    name: 'UserProfileState',
    global: true,
    storage: globalThis.sessionStorage,
    initialState: {
      displayName: '',
      fullName: '',
      hasNotification: false,
    },
  });
}
