import { mutative } from '@wener/reaction/mutative/zustand';
import { createStore } from 'zustand';

export interface UserProfileData {
  id: string;
  displayName: string;
  fullName: string;
  loginName: string;
  avatarUrl?: string;
  photoUrl?: string;
  email: string;
  roles: {
    id: string;
    title: string;
    code: string;
  }[];
}

export interface UserState extends UserProfileData {
  load(data: UserProfileData): void;
}

export type UserStore = ReturnType<typeof createUserStore>;

export function createUserStore(init: Partial<UserState> = {}) {
  return createStore(
    mutative<UserState>((setState, getState, store) => {
      return {
        id: '',
        displayName: '',
        fullName: '',
        loginName: '',
        email: '',
        roles: [],
        ...init,
        load: (v) => {
          setState((s) => {
            Object.assign(s, v);
          });
        },
      };
    }),
  );
}
