import type { Meta } from '@storybook/react';
import { Clock } from './Clock';

const meta: Meta = {
  title: 'Applet/Clock',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  return <Clock />;
};
