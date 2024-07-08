import React from 'react';
import { Meta } from '@storybook/react';
import { ConsoleApp } from '@/demo/ConsoleApp';

const meta: Meta = {
  title: 'console/demo',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  return (
    <div className={'absolute inset-0'}>
      <ConsoleApp />
    </div>
  );
};
