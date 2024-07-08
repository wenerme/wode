import { Meta } from '@storybook/react';
import { ComponentProvider } from '@/components/ComponentProvider';
import { SiteLogo } from '@/console/components/KnownDefinedComponent';
import { WenerLogo } from '@/demo/modules/site.core/WenerLogo';

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
      <ComponentProvider components={[{ provide: SiteLogo, Component: WenerLogo }]}>
        <SiteLogo className={'h-6 w-6'} />
      </ComponentProvider>
    </div>
  );
};
