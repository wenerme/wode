import React from 'react';
import { HiChevronDown, HiColorSwatch } from 'react-icons/hi';
import { MdSettings } from 'react-icons/md';
import classNames from 'classnames';
import { Listbox } from '@headlessui/react';
import { useTheme } from '@src/hooks/useTheme';

export const ThemeSelector = () => {
  const [theme, setTheme] = useTheme(({ theme, setTheme }) => [theme, setTheme]);
  return (
    <Listbox value={theme} onChange={setTheme} as="div" className="relative inline-block text-left">
      <Listbox.Button
        className={classNames(
          'px-2 py-1 gap-0.5 inline-flex justify-center items-center text-sm font-medium rounded-md bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75',
          'hover:bg-base-200 transition-colors',
        )}
      >
        <HiColorSwatch className={'w-6 h-6'} />
        <span className={'hidden sm:inline'}>主题</span>
        <HiChevronDown />
      </Listbox.Button>
      {/*<Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">*/}
      <Listbox.Options
        className={classNames(
          'absolute z-50 right-0 bg-base-200 p-2 w-[200px] h-[400px] overflow-y-auto rounded text-sm flex flex-col gap-2',
          'shadow-lg border border-base-300',
        )}
      >
        {themes.map((item) => (
          <Listbox.Option
            key={item.value}
            value={item.value}
            data-theme={item.value}
            className={({ active }) =>
              classNames(
                'cursor-pointer',
                'p-2 rounded',
                'flex items-center justify-between',
                // 'hover:bg-accent-focus transition-colors',
                // active && 'bg-accent-focus',
              )
            }
          >
            {({ selected }) => {
              if (!item.icon) {
                return (
                  <div className="grid grid-cols-5 grid-rows-3">
                    <div className="bg-base-200 col-start-1 row-span-2 row-start-1"></div>
                    <div className="bg-base-300 col-start-1 row-start-3"></div>
                    <div className="bg-base-100 col-span-4 col-start-2 row-span-3 row-start-1 flex flex-col gap-1 p-2">
                      <div className="font-bold">{item.value}</div>
                      <div className="flex flex-wrap gap-1">
                        <div className="bg-primary flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                          <div className="text-primary-content text-sm font-bold">A</div>
                        </div>
                        <div className="bg-secondary flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                          <div className="text-secondary-content text-sm font-bold">A</div>
                        </div>
                        <div className="bg-accent flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                          <div className="text-accent-content text-sm font-bold">A</div>
                        </div>
                        <div className="bg-neutral flex aspect-square w-5 items-center justify-center rounded lg:w-6">
                          <div className="text-neutral-content text-sm font-bold">A</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <>
                  {selected ? item.icon : item.iconActive || item.icon} {item.label}
                </>
              );
            }}
          </Listbox.Option>
        ))}
      </Listbox.Options>
      {/*</Transition>*/}
    </Listbox>
  );
};

const themes = [
  // { label: 'Light', value: 'light', icon: <MdLightMode />, iconActive: <MdOutlineLightMode /> },
  // { label: 'Dark', value: 'dark', type: 'dark', icon: <MdDarkMode />, iconActive: <MdOutlineDarkMode /> },
  { label: 'System', value: 'system', icon: <MdSettings />, iconActive: null },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'cupcake', value: 'cupcake' },
  { label: 'bumblebee', value: 'bumblebee' },
  { label: 'emerald', value: 'emerald' },
  { label: 'corporate', value: 'corporate' },
  { label: 'synthwave', value: 'synthwave', type: 'dark' },
  { label: 'retro', value: 'retro' },
  { label: 'cyberpunk', value: 'cyberpunk' },
  { label: 'valentine', value: 'valentine' },
  { label: 'halloween', value: 'halloween', type: 'dark' },
  { label: 'garden', value: 'garden' },
  { label: 'forest', value: 'forest', type: 'dark' },
  { label: 'aqua', value: 'aqua' },
  { label: 'lofi', value: 'lofi' },
  { label: 'pastel', value: 'pastel' },
  { label: 'fantasy', value: 'fantasy' },
  { label: 'wireframe', value: 'wireframe' },
  { label: 'black', value: 'black', type: 'dark' },
  { label: 'luxury', value: 'luxury', type: 'dark' },
  { label: 'dracula', value: 'dracula', type: 'dark' },
  { label: 'cmyk', value: 'cmyk' },
  { label: 'autumn', value: 'autumn' },
  { label: 'business', value: 'business', type: 'dark' },
  { label: 'acid', value: 'acid' },
  { label: 'lemonade', value: 'lemonade' },
  { label: 'night', value: 'night', type: 'dark' },
  { label: 'coffee', value: 'coffee', type: 'dark' },
  { label: 'winter', value: 'winter' },
];
