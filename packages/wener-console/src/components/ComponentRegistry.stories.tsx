import type { Meta } from '@storybook/react';
import { SiteLogo } from '../console/components';
import { ComponentProvider } from './ComponentProvider';

const meta: Meta = {
  title: 'React/ComponentProvider',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  // const reg = useComponentRegistry();

  return (
    <div>
      <div>Default SiteLogo</div>
      <SiteLogo className={'h-6 w-6'} />
      <div>Provided SiteLogo</div>
      <ComponentProvider components={[]}>
        <SiteLogo className={'h-6 w-6'} />
      </ComponentProvider>
    </div>
  );
};
