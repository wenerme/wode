import React, { type FC, type PropsWithChildren } from 'react';
import { PiGithubLogoFill, PiGlobeLight, PiListLight, PiMagnifyingGlassBold, PiXLogoFill } from 'react-icons/pi';
import { Trans } from '@lingui/macro';
import { WenerAvatarIcon } from 'common/icons';
import Link from 'next/link';
import { loadI18n } from '@/i18n/loadI18n';
import type { NextPageProps } from '@/types';

export const PageLayout: FC<PropsWithChildren & Partial<NextPageProps>> = async ({
  children,
  searchParams,
  params,
}) => {
  await loadI18n({
    lang: params?.lang || searchParams?.lang,
    source: 'PageLayout',
  });
  return (
    <div className={'flex min-h-screen flex-col'}>
      <Nav />
      {children}
      <Footer />
    </div>
  );
};
const Socials = [
  {
    icon: <WenerAvatarIcon className={'h-6 w-6'} />,
    title: 'Blog',
    href: 'https://wener.me',
  },
  {
    icon: <PiXLogoFill className={'h-6 w-6'} />,
    title: 'Twitter',
    href: 'https://twitter.com/wenerme',
  },
  {
    icon: <PiGithubLogoFill className={'h-6 w-6'} />,
    title: 'GitHub',
    href: 'https://github.com/wenerme/wode',
  },
];
const Footer = () => {
  return (
    <footer className='footer bg-neutral p-10 text-neutral-content print:hidden'>
      <aside>
        <WenerAvatarIcon />
        <p>
          Wener.
          <br />
          since 1992
        </p>
      </aside>
      <nav>
        <h6 className='footer-title'>Social</h6>
        <div className='grid grid-flow-col gap-4'>
          {Socials.map((item, index) => (
            <a
              key={index}
              title={item.title}
              href={item.href}
              className='btn btn-ghost opacity-75 hover:opacity-100'
              target={'_blank'}
              rel={'noreferrer noopener'}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </nav>
    </footer>
  );
};
const Nav = () => {
  return (
    <div className='navbar bg-base-100 print:hidden'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <div tabIndex={0} role='button' className='btn btn-circle btn-ghost'>
            <PiListLight className={'size-6'} />
          </div>
          <ul tabIndex={0} className='menu dropdown-content menu-sm z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow'>
            <li>
              <a>Homepage</a>
            </li>
            <li>
              <a>Portfolio</a>
            </li>
            <li>
              <a>About</a>
            </li>
          </ul>
        </div>
      </div>
      <div className='navbar-center'>
        <Link href={'/'} className='btn btn-ghost text-xl'>
          Wener APIs
        </Link>
      </div>
      <div className='navbar-end'>
        <SearchButton />
        <LanguageSwitch />
      </div>
    </div>
  );
};

const SearchButton = () => {
  return (
    <button type={'button'} className='btn btn-circle btn-ghost'>
      <PiMagnifyingGlassBold className={'size-6'} />
    </button>
  );
};

const LanguageSwitch = () => {
  const options = [
    {
      label: '简体中文',
      value: 'zh-CN',
    },
    {
      label: 'English',
      value: 'en',
    },
  ];
  return (
    <div className='dropdown dropdown-end'>
      <div tabIndex={0} role='button' className='btn btn-ghost'>
        <span className={'flex items-center'}>
          <PiGlobeLight className={'size-6'} />
          <Trans id={'page.nav.language'}>语言</Trans>
          <span className='ml-2 text-xs'>▼</span>
        </span>
      </div>
      <ul tabIndex={0} className='menu dropdown-content w-32 rounded-box bg-base-100 shadow-lg'>
        {options.map((item, index) => (
          <li key={index}>
            <Link href={`/${item.value}`}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};