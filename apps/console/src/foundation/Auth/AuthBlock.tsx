import type React from 'react';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AuthStatus, useAuthStore } from '@/foundation/Auth/AuthStore';

export const AuthBlock: React.FC<
  PropsWithChildren & {
    fallback?: React.ReactNode;
  }
> = ({ children, fallback }) => {
  let store = useAuthStore();
  const [authed, setAuthed] = useState(() => {
    return store.getState().status === AuthStatus.Authenticated;
  });
  useEffect(() => {
    // if (authed) return;
    let unsub = store.subscribe((s) => {
      if (s.status === AuthStatus.Authenticated) {
        setAuthed(true);
      } else if (s.status === AuthStatus.Unauthenticated) {
        setAuthed(false);
      }
    });
    return unsub;
  }, []);

  if (!authed) {
    return fallback;
  }
  return <>{children}</>;
};
