'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';

const CurrentPage = () => {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <Content />
    </SessionProvider>
  );
};

export default CurrentPage;

const Content = () => {
  const { data: session, status } = useSession();

  if (status === 'authenticated') {
    return <p>Signed in as {session.user?.email}</p>;
  }

  return <a href='/auth/signin'>Sign in</a>;
};
