import React, { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { BiLogoChrome } from 'react-icons/bi';
import { CiLock, CiUser } from 'react-icons/ci';
import { GrSystem } from 'react-icons/gr';
import { HiMiniLanguage } from 'react-icons/hi2';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { PiBuildingsThin } from 'react-icons/pi';
import { useMounted } from '@wener/reaction';
import { clsx } from 'clsx';
import { WechatBrandIcon, WecomBrandIcon } from '@/icons';
import { cn } from '@/lib/utils';
import { TODO } from '@/toast';

export type LoginFormData = {
  org?: string;
  ticket?: string;
  password: string;
  username: string;
  remember?: boolean;
};

type LinkProps = {
  url?: string;
  text?: string;
};

export interface LoginPageProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'onSubmit'> {
  onSubmit?: (data: LoginFormData) => void;
  children?: ReactNode;
  defaultValues?: Partial<LoginFormData>;
  title?: string;
  subtitle?: ReactNode;
  showOrg?: boolean;
  showRegistry?: boolean;
  showoff?: ReactNode;
  logo?: ReactNode;

  socials?: Array<{
    name: string;
    icon?: ReactNode;
    onClick: () => void;
  }>;

  footer?: {
    policy?: LinkProps;
    terms?: LinkProps;
    beian?: LinkProps;
  };
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSubmit = () => undefined,
  showoff,
  children,
  defaultValues,
  showOrg,
  showRegistry,
  title,
  subtitle = '登录系统',
  socials,
  footer: { policy, terms, beian } = {},
  logo = <GrSystem className={'h-10 w-10'} />,
  className,
  ...props
}) => {
  const methods = useForm<LoginFormData>({
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = methods;
  // const { get } = useContextStore<SitePreferences>();
  // title ||= get('site.title');
  return (
    <>
      <div className={cn('flex min-h-full flex-1', className)} {...props}>
        <div className='relative flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24'>
          <div className='mx-auto w-full max-w-sm lg:w-96'>
            <div>
              <div className={'flex items-center gap-2'}>
                {logo} <span className={'text-xl font-medium'}>{title}</span>
              </div>
              <h2 className='mt-8 text-2xl font-bold leading-9 tracking-tight opacity-80'>{subtitle}</h2>
              {showRegistry && (
                <p className='mt-2 text-sm leading-6 opacity-60'>
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
                        <span className={'btn-bordered btn join-item'}>
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
                      <span className={'btn-bordered btn join-item'}>
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
                      <span className={'btn-bordered btn join-item'}>
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
                        onClick={() => TODO('忘了密码')}
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

              {socials && <SocialLogin />}

              {children}
            </div>
          </div>

          <footer className={'absolute bottom-0 flex items-center justify-between pb-2'}>
            <div className='text-center text-sm leading-6 opacity-80'>
              {joinNode(
                [
                  <span>© {new Date().getFullYear()}</span>,
                  renderLink({ text: '隐私政策', ...policy }),
                  renderLink({ text: '服务条宽', ...policy }),
                  // http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11000002000001
                  renderLink({ url: 'https://beian.miit.gov.cn/', ...beian }),
                ],
                <span className='mx-1'>•</span>,
              )}
            </div>
            <span className={'mr-2'}></span>
            <UserAgentSummary />
          </footer>
        </div>
        <div className='relative hidden w-0 flex-1 lg:block'>{showoff}</div>
      </div>
    </>
  );
};

function renderLink({ text, url }: { text?: string; url?: string }) {
  if (!text || !url) {
    return;
  }
  return (
    <a href={url} target={'_blank'} className='hover:underline'>
      {text}
    </a>
  );
}

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

function joinNode(nodes: ReactNode[], join: ReactNode) {
  return nodes.filter(Boolean).map((n, i) => {
    let last = i <= nodes.length - 1;
    return (
      <React.Fragment key={i}>
        {n}
        {last || join}
      </React.Fragment>
    );
  });
}

function MaybeExternalLink({ href, children }: { href: string; children: ReactNode }) {}

const UserAgentSummary = () => {
  let mounted = useMounted();
  if (!mounted) {
    return null;
  }

  return (
    <small className={'flex items-center gap-1 text-xs opacity-75'}>
      <Browser />
      <Lang />
      <ThemePerf />
    </small>
  );
};

const ThemePerf = () => {
  let { colorTheme } = getUserAgentPrefers();
  return (
    <>
      {colorTheme === 'dark' && <MdDarkMode />}
      {colorTheme === 'light' && <MdLightMode />}
    </>
  );
};

interface UserAgentPrefers {
  colorTheme: 'light' | 'dark';
  contrast: 'no-preference' | 'more' | 'less' | 'custom';
  reducedMotion: 'no-preference' | 'reduce';
}

function getUserAgentPrefers(): UserAgentPrefers {
  let out: UserAgentPrefers = {
    colorTheme: 'light',
    contrast: 'no-preference',
    reducedMotion: 'no-preference',
  };
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
    return out;
  }

  out.colorTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : out.colorTheme;
  out.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : out.reducedMotion;

  return out;
}

function getPrefersColorSchema(): 'dark' | 'light' {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const Lang = () => {
  return (
    <span className={'inline-flex items-center'}>
      <HiMiniLanguage />
      {navigator.language}
    </span>
  );
};

const Browser = () => {
  const { brand, version } = navigator.userAgent.match(/(?<brand>Chrom(e|ium))\/(?<version>[0-9]+)\./)?.groups ?? {};
  if (!brand) {
    return <small className={'text-xs text-error opacity-75'}>请使用新版本的 Chrome 浏览器。</small>;
  }
  let old = parseInt(version) < 90;

  return (
    <div className={'inline-flex items-center'}>
      <BiLogoChrome />
      {brand} {version}
      {old && (
        <small className={'text-xs text-warning opacity-75'}>
          当前浏览器版本 {version} 过低，请下载使用新版本浏览器。
        </small>
      )}
    </div>
  );
};
