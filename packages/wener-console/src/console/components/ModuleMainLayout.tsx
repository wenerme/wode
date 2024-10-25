import React, { type FC } from 'react';
import { Outlet } from 'react-router-dom';
import { z } from 'zod';
import { ExpandableSideMenuLayout, type ExpandableSideMenuLayoutProps } from '../../web';
import { useUserPreferenceState } from '../hooks';

const ModuleLayoutState = z.object({
  expanded: z.boolean().optional().default(true),
});

function useModuleLayoutState({ path }: { path: string }) {
  return useUserPreferenceState({
    key: `ModuleLayoutState.${path}`,
    schema: ModuleLayoutState,
  });
}

export const ModuleMainLayout: FC<
  ExpandableSideMenuLayoutProps & {
    path?: string;
  }
> = ({ children = <Outlet />, path = 'default', ...props }) => {
  const [{ expanded }, update] = useModuleLayoutState({ path });
  return (
    <ExpandableSideMenuLayout
      expanded={expanded}
      onExpandedChange={(next) => {
        update({ expanded: next });
      }}
      {...props}
    >
      {children}
    </ExpandableSideMenuLayout>
  );
};
