import { Meta } from '@storybook/react';
import { RegisteredComponent, useComponentRegistry } from '@/components/ComponentRegistry';
import { SiteLogo } from '@/console/components/KnownDefinedComponent';

const meta: Meta = {
  title: 'Components/Registry',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

export const Demo = () => {
  const reg = useComponentRegistry();

  return (
    <div>
      <div>Component</div>
      <SiteLogo />
      <div>Component Lists</div>
      {reg.getComponentNames().map((name) => {
        return (
          <div className={'flex flex-col'}>
            <h2>{name}</h2>
            <RegisteredComponent $name={name} />
          </div>
        );
      })}
    </div>
  );
};
