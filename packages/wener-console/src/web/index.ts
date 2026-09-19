export { WebVitals } from '../components/WebVitals';
export { SiteLogo } from '../console/SiteLogo';
export { ConsoleContext, getConsoleContext, setConsoleContext } from './ConsoleContext';

export { ModuleService } from './module/ModuleService';
export type * from './module/types';
export { type AutoNavLinkProps, NavLink as AutoNavLink } from '../components/links';
export { type ExpandableSideMenuItemProps } from '../components';
import { IconSidebarLayout } from '../components/IconSidebarLayout/IconSidebarLayout';

export const LeftSideMenuBarLayout = Object.assign(IconSidebarLayout.Layout, {
	MenuBarItem: IconSidebarLayout.Item,
});
export * from './prefs';
export { usePageLayoutState } from './usePageLayoutState';
