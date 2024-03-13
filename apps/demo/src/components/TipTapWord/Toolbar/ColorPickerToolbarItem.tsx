import React from 'react';
import { Popover } from '@headlessui/react';
import classNames from 'classnames';
import { ColorPlates } from '@/components/TipTapWord/components/ColorPlates';

export const ColorPickerToolbarItem: React.FC<{
  value: string;
  onChange?: (v: string) => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onReset?: () => void;
  className?: string;
}> = ({ value, onChange, icon, children, onReset, className }) => {
  return (
    <Popover className='relative'>
      {({ open, close }) => {
        return (
          <>
            <Popover.Button className={classNames('__tool flex flex-col', className)}>
              {icon}
              {children}
              <div style={{ height: 3, width: 14, backgroundColor: value || '' }}></div>
            </Popover.Button>
            <Popover.Panel className='absolute z-10 p-2 border rounded shadow bg-white' style={{ width: 250 }}>
              <ColorPlates
                value={value}
                onChange={(v) => {
                  onChange?.(v);
                  close();
                }}
                onReset={onReset}
              />
            </Popover.Panel>
          </>
        );
      }}
    </Popover>
  );
};
