import React from 'react';
import { HiOutlineLogout } from 'react-icons/hi';
import { HiUsers } from 'react-icons/hi2';
import classNames from 'classnames';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Popover, Transition } from '@headlessui/react';
import { Button } from '../../daisy';

export const DockUserAvatar = () => {
  const { data: session, status } = useSession();
  if (status === 'unauthenticated') {
    return (
      <Button size={'md'} ghost circle className={'opacity-80'} onClick={() => signIn()}>
        <HiUsers className={'w-6 h-6'} />
        <small className={'text-xs'}>未登录</small>
      </Button>
    );
  }

  if (!session?.user) {
    return null;
  }
  const { user: { image, name, email } = {} } = session;
  const hasNotification = false;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            type={'button'}
            className={classNames('btn btn-md btn-ghost btn-circle p-0', open && 'btn-active')}
          >
            <div className={classNames('avatar', !image && 'placeholder', hasNotification && 'online')}>
              {image && (
                <div className="w-10 rounded-full">
                  <img alt={name || 'user avatar'} src={image} />
                </div>
              )}
            </div>
          </Popover.Button>
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-full top-0 z-10 mr-2 w-[180px] ">
              <div className="overflow-hidden rounded-lg bg-base-100/50 p-3 shadow-lg ring-1 ring-black ring-opacity-5 backdrop-blur">
                <div>
                  <div className={'text-lg font-medium'}>{name}</div>
                  <div className={'flex gap-4 items-baseline justify-between'}>
                    <span title={'用户名'}>{email}</span>
                    {/*{employeeNumber && <small title={'员工编号'}>#{employeeNumber}</small>}*/}
                  </div>
                </div>
                <hr className={'my-2 border-base-200'} />
                <ul className={'menu p-2'}>
                  <li>
                    <button
                      type={'button'}
                      onClick={() => {
                        void signOut();
                      }}
                    >
                      <HiOutlineLogout />
                      退出登录
                    </button>
                  </li>
                </ul>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
