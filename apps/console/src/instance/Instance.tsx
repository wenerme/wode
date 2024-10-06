import type { FC, PropsWithChildren } from 'react';
import { ComponentProvider } from '@wener/console/components';
import { SiteLogo } from '@wener/console/console';
import { WenerLogo } from '@/instance/WenerLogo';

export namespace Instance {
  export const Provide: FC<PropsWithChildren> = ({ children }) => {
    return (
      <>
        <ComponentProvider components={[{ provide: SiteLogo, Component: WenerLogo }]}>{children}</ComponentProvider>
      </>
    );
  };
}
