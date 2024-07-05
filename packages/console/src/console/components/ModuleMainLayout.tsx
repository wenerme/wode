import React from 'react';
import { Outlet } from 'react-router-dom';
import { z } from 'zod';
import { useUserPreferenceState } from '@/console/hooks/useUserPreferenceState';
import { ExpandableSideMenuLayout, ExpandableSideMenuLayoutProps } from '@/web';

const ModuleLayoutState = z.object({
  expanded: z.boolean().optional().default(true),
});

function useModuleLayoutState({ path }: { path: string }) {
  return useUserPreferenceState({
    key: `ModuleLayoutState.${path}`,
    schema: ModuleLayoutState,
  });
}

export const ModuleMainLayout: React.FC<
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
