import React from 'react';
import { PiGlobeLight } from 'react-icons/pi';
import { Trans } from '@lingui/macro';
import Link from 'next/link';

function setLocale(locale: string) {
  // document.cookie = `lang=${locale}; path=/`;
  const url = new URL(window.location.href);
  url.searchParams.delete('lang');
  window.location.href = url.toString();
}

export const LanguageSwitch = () => {
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
            <Link
              href={{
                query: {
                  lang: item.value,
                },
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
