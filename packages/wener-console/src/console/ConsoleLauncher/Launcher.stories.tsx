import { useEffect } from 'react';
import { PiClock } from 'react-icons/pi';
import type { Meta } from '@storybook/react';
import { Launcher } from './Launcher';

const meta: Meta = {
  title: 'console/Launcher',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  useEffect(() => {
    Launcher.addItems([
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
          Launcher.toggle();
        }}
      >
        打开
      </button>
      <Launcher.Host />
    </div>
  );
};
