import type { Meta } from '@storybook/react';
import { WindowHost } from '@wener/console/web/window';
import { DockLayout } from './DockLayout';

const meta: Meta = {
  title: 'Web/Layout/DockLayout',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  return (
    <>
      <WindowHost />
      <DockLayout />
    </>
  );
};
