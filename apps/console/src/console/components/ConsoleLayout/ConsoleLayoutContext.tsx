import type { ReactElement, ReactNode } from 'react';

export interface ConsoleLayoutContext {
  console?: {
    icon?: ReactElement;
    menu?: {
      top?: DashMenu[];
      center?: DashMenu[];
      bottom?: DashMenu[];
    };
  };
}

export interface DashMenuItem {
  title: string;
  href?: string;
  icon: ReactElement;
  iconActive?: ReactElement;
  onClick?: () => void;
}

export type DashMenu =
  | {
      type: 'group';
      name?: string;
      title?: string;
      items: DashMenuItem[];
    }
  | DashMenuItem;
