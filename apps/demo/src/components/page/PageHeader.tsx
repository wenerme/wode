import React from 'react';
import classNames from 'classnames';
import Link from 'next/link';
import { NavLinks } from '@/components/page/const';
import { ThemeSelectorButton } from '../../../../../packages/console/daisy';

interface MenuSpec {
  icon?: React.ReactNode;
  label: React.ReactNode;
  href?: string;
  children?: MenuSpec[];
}

function renderItem(v: MenuSpec, key: number) {
  return (
    <li key={key}>
      <Link href={v.href || ''}>
        {v.icon}
        {v.label}
      </Link>
    </li>
  );
}

function Right() {
  return (
    <svg className='fill-current' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
      <path d='M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z' />
    </svg>
  );
}

function Down() {
  return (
    <svg className='fill-current' xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'>
      <path d='M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z' />
    </svg>
  );
}

function renderMenu(menu: MenuSpec[], { icon = <Down />, listClassName = 'z-20 border border-color shadow-lg' } = {}) {
  return menu.map((v, i) => {
    if (v.children?.length) {
      return (
        <li tabIndex={0} key={i} className={''}>
          <Link href={v.href || '/'} className='justify-between'>
            {v.icon}
            {v.label}
            {icon}
          </Link>
          <ul className={classNames('p-2', listClassName)}>{v.children.map(renderItem)}</ul>
        </li>
      );
    }

    return renderItem(v, i);
  });
}

function MenuIcon() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h8m-8 6h16' />
    </svg>
  );
}

export const PageHeader = () => {
  return (
    <header className={'container mx-auto'}>
      <div className='navbar bg-base-100'>
        <div className='navbar-start'>
          <details className='dropdown'>
            <summary tabIndex={0} className='btn btn-ghost lg:hidden'>
              <MenuIcon />
            </summary>
            <ul
              tabIndex={0}
              className='menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52'
            >
              {renderMenu(NavLinks, { icon: <Right /> })}
            </ul>
          </details>
          <Link href={'/'} className='btn btn-ghost normal-case text-xl'>
            Wener Web Demo
          </Link>
        </div>
        <div className='navbar-center hidden lg:flex'>
          <ul className='menu menu-horizontal p-0'>{renderMenu(NavLinks, { icon: <Down /> })}</ul>
        </div>
        <div className='navbar-end'>
          <ThemeSelectorButton />
        </div>
      </div>
    </header>
  );
};
