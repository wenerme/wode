import React, { useEffect, useState } from 'react';
import { HiLockClosed, HiMiniLockOpen } from 'react-icons/hi2';
import clsx from 'clsx';
import { useStore } from 'zustand';
import { getConsoleStore } from '@/console';
import { Button, NonIdealState } from '../../daisy';
import { getUserAction } from './getUserAction';

export const UserLockOverlay = () => {
  const { unlock } = getUserAction();
  const { expired, locked } = useStore(getConsoleStore(), ({ expired, locked }) => ({ expired, locked }));
  const [hidden, setHidden] = useState(!expired);
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (locked) {
      setPin(Math.random().toString().slice(-4));
      setHidden(false);
    }
  }, [locked]);
  if (hidden || expired) {
    return null;
  }
  return (
    <div
      className={clsx(
        'absolute inset-0 z-50 flex items-center justify-center',
        'transition duration-500',
        locked ? 'opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0 backdrop-blur-none',
        hidden && !locked && 'hidden',
      )}
      onAnimationEnd={() => {
        if (!locked) {
          setHidden(true);
        }
      }}
    >
      <div className={'rounded border-base-200 bg-base-100 px-8 py-4 shadow-xl'}>
        <NonIdealState
          icon={<HiLockClosed className='h-12 w-12' />}
          title={
            <div className={'flex flex-col gap-1'}>
              <span>系统已锁定</span>
              <span>{pin}</span>
            </div>
          }
          description={'点击解锁进入系统'}
          action={
            <div className={'flex gap-2 opacity-95'}>
              <Button autoFocus className={'btn-success btn-sm'} onClick={unlock}>
                <HiMiniLockOpen className={'h-4 w-4'} />
                解锁
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};
