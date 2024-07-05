import React from 'react';
import { Meta } from '@storybook/react';
import { DemoApp } from '@/demo/DemoApp';

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
      <DemoApp />
    </div>
  );
};
