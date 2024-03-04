import React, { useEffect, useState } from 'react';
import { HiMiniArrowPath, HiMiniArrowRightOnRectangle as LoginIcon, HiOutlineNoSymbol } from 'react-icons/hi2';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';
import { Button, NonIdealState } from '../../daisy';
import { getUserAction } from './getUserAction';
import { getUserSessionState } from './getUserSessionState';

export const UserAuthExpireOverlay = () => {
  const { signIn } = getUserAction();
  const { expired } = useSnapshot(getUserSessionState());
  const [hidden, setHidden] = useState(!expired);
  useEffect(() => {
    if (expired) {
      setHidden(false);
    }
  }, [expired]);
  if (hidden) {
    return null;
  }
  return (
    <div
      className={clsx(
        'z-50 absolute inset-0 flex items-center justify-center',
        'transition duration-500',
        expired ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 backdrop-blur-none pointer-events-none',
        hidden && !expired && 'hidden',
      )}
      onAnimationEnd={() => {
        if (!expired) {
          setHidden(true);
        }
      }}
    >
      <div className={'bg-base-100 rounded px-8 py-4 border-base-200 shadow-xl'}>
        <NonIdealState
          icon={<HiOutlineNoSymbol className='w-12 h-12' />}
          title={'登陆失效'}
          description={'请尝试重新登陆或刷新页面'}
          action={
            <div className={'flex gap-2 opacity-95'}>
              <Button className={'btn-sm btn-success'} onClick={signIn}>
                <LoginIcon className={'w-4 h-4'} />
                登陆
              </Button>
              <Button
                className={'btn-sm btn-outline'}
                onClick={() => {
                  window.location.reload();
                }}
              >
                <HiMiniArrowPath className={'w-4 h-4'} />
                刷新
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};
