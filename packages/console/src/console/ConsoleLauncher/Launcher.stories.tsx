import React, { useEffect } from 'react';
import { PiClock } from 'react-icons/pi';
import { Meta } from '@storybook/react';
import { addLaunchItems, ConsoleLauncher, toggleLauncher } from './ConsoleLauncher';

const meta: Meta = {
  title: 'console/Launcher',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  useEffect(() => {
    addLaunchItems([
      {
        key: 'clock',
        title: '时间',
        icon: <PiClock />,
      },
    ]);
  }, []);
  return (
    <div>
      <button
        type={'button'}
        className={'btn btn-sm'}
        onClick={() => {
          toggleLauncher();
        }}
      >
        打开
      </button>
      <ConsoleLauncher />
    </div>
  );
};
