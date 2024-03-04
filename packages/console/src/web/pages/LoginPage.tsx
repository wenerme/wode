import React, { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { CiLock, CiUser } from 'react-icons/ci';
import { PiBuildingsThin } from 'react-icons/pi';
import { clsx } from 'clsx';
import { useContextStore } from '../../hooks';
import { WechatBrandIcon, WecomBrandIcon } from '../../icons';
import { TODO } from '../../toast';
import { SitePreferences } from '../prefs';
import { SiteLogo } from '../site/SiteLogo';

export type LoginFormData = {
  org?: string;
  ticket?: string;
  password: string;
  username: string;
  remember: boolean;
};

export const LoginPage: React.FC<{
  onSubmit?: (data: LoginFormData) => void;
  children?: ReactNode;
  defaultValues?: Partial<LoginFormData>;
  title?: string;
  showOrg?: boolean;
  showRegistry?: boolean;
  showoff?: ReactNode;
}> = ({ onSubmit = () => undefined, showoff, children, defaultValues, showOrg, showRegistry, title }) => {
  const methods = useForm<LoginFormData>({
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = methods;
  const { get } = useContextStore<SitePreferences>();
  title ||= get('site.title');
  return (
    <>
      <div className='flex min-h-full flex-1'>
        <div className='flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24'>
          <div className='mx-auto w-full max-w-sm lg:w-96'>
            <div>
              <div className={'flex items-center gap-2'}>
                <SiteLogo className={'w-10 h-10'} /> <span className={'text-xl font-medium'}>{title}</span>
              </div>
              <h2 className='mt-8 text-2xl font-bold leading-9 tracking-tight opacity-80'>登录系统</h2>
              {showRegistry && (
                <p className='mt-2 text-sm leading-6  opacity-60'>
                  尚未加入?{' '}
                  <a href='#' className='font-semibold text-indigo-600 hover:text-indigo-500'>
                    注册试用
                  </a>
                </p>
              )}
            </div>

            <div className='mt-10'>
              <div>
                <form onSubmit={handleSubmit(onSubmit)} method='POST' className='space-y-6'>
                  <div className={'flex flex-col gap-2'}>
                    {showOrg && (
                      <div className='join w-full'>
                        <span className={'btn-bordered btn join-item '}>
                          <PiBuildingsThin className={'h-6 w-6'} />
                        </span>
                        <input
                          className='input join-item input-bordered flex-1'
                          placeholder={'企业'}
                          value={title || undefined}
                          readOnly={Boolean(title)}
                          required
                          {...register('org', {
                            required: true,
                          })}
                        />
                      </div>
                    )}

                    <div className='join w-full'>
                      <span className={'btn-bordered btn join-item '}>
                        <CiUser className={'h-6 w-6'} />
                      </span>
                      <input
                        autoComplete='username'
                        className='input join-item input-bordered flex-1'
                        placeholder={'用户'}
                        required
                        {...register('username', {
                          required: true,
                        })}
                      />
                    </div>

                    <div className='join w-full'>
                      <span className={'btn-bordered btn join-item '}>
                        <CiLock className={'h-6 w-6'} />
                      </span>
                      <input
                        type='password'
                        autoComplete='current-password'
                        className='input join-item input-bordered flex-1'
                        placeholder={'密码'}
                        required
                        {...register('password', {
                          required: true,
                        })}
                      />
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <input id='remember-me' type='checkbox' className='h-4 w-4 rounded' {...register('remember')} />
                      <label htmlFor='remember-me' className='ml-3 block text-sm leading-6 opacity-75'>
                        记住登录
                      </label>
                    </div>

                    <div className='text-sm leading-6'>
                      <a
                        href='#'
                        onClick={() => TODO()}
                        className='font-semibold text-indigo-600 hover:text-indigo-500'
                      >
                        忘了密码？
                      </a>
                    </div>
                  </div>

                  <div>
                    <button
                      type='submit'
                      className='flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      disabled={!isValid || isSubmitting}
                    >
                      {isSubmitting && <span className='loading loading-spinner loading-xs'></span>}
                      登录
                    </button>
                  </div>
                </form>
              </div>

              {/*<SocialLogin />*/}

              {children}
            </div>
          </div>
        </div>
        <div className='relative hidden w-0 flex-1 lg:block'>{showoff}</div>
      </div>
    </>
  );
};

const SocialLogin = () => {
  return (
    <div className='mt-10'>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center' aria-hidden='true'>
          <div className='w-full border-t border-gray-200' />
        </div>
        <div className='relative flex justify-center text-sm font-medium leading-6'>
          <span className='bg-white px-6 opacity-80'>社交方式登录</span>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-2 gap-4'>
        <a href='#' className={clsx('btn-bordered btn btn-sm rounded-md')}>
          <WechatBrandIcon className={'h-4 w-4'} />
          <span className='text-sm font-semibold leading-6'>Wechat</span>
        </a>

        <a href='#' className={clsx('btn-bordered btn btn-sm rounded-md')}>
          <WecomBrandIcon className={'h-4 w-4'} />
          <span className='text-sm font-semibold leading-6'>企业微信</span>
        </a>
      </div>
    </div>
  );
};
