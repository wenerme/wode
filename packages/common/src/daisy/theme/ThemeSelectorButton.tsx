import React, { Fragment } from 'react';
import { HiChevronDown, HiColorSwatch } from 'react-icons/hi';
import { MdSettings } from 'react-icons/md';
import classNames from 'classnames';
import { useSnapshot } from 'valtio';
import { Listbox, Transition } from '@headlessui/react';
import { ThemePreviewCard } from './ThemePreviewCard';
import { getSupportedThemes } from './getSupportedThemes';
import { useThemeState } from './useTheme';

export const ThemeSelectorButton = () => {
  const state = useThemeState();
  const { theme } = useSnapshot(state);
  const setTheme = (v: string) => {
    state.theme = v;
  };
  return (
    <Listbox value={theme} onChange={setTheme} as="div" className="relative inline-block text-left">
      <Listbox.Button
        className={classNames(
          'inline-flex items-center justify-center gap-0.5 rounded-md bg-opacity-20 px-2 py-1 text-sm font-medium hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75',
          'transition-colors hover:bg-base-200',
        )}
      >
        <HiColorSwatch className={'h-6 w-6'} />
        <span className={'hidden sm:inline'}>主题</span>
        <HiChevronDown />
      </Listbox.Button>
      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
        <Listbox.Options
          className={classNames(
            'absolute right-0 z-50 flex h-[400px] w-[200px] flex-col gap-2 overflow-y-auto rounded bg-base-200 p-2 text-sm',
            'border border-base-300 shadow-lg',
          )}
        >
          {[{ label: '跟随系统', value: 'system' }, ...getSupportedThemes()].map((item) => (
            <Listbox.Option
              key={item.value}
              value={item.value}
              data-theme={item.value}
              className={({ active }) =>
                classNames(
                  'cursor-pointer',
                  'rounded p-2',
                  'flex items-center justify-between',
                  'text-base-content bg-base-100',
                  // 'hover:bg-primary-focus transition-colors',
                  'border border-transparent',
                  active && 'border-primary-focus',
                )
              }
            >
              {({ selected }) => {
                if (item.value === 'system') {
                  return (
                    <>
                      <MdSettings />
                      {item.label}
                    </>
                  );
                }
                return <ThemePreviewCard title={item.value} />;
              }}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </Transition>
    </Listbox>
  );
};
