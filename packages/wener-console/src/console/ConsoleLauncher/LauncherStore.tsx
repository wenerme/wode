import { Launcher, type LauncherItem } from './Launcher';

/**
 * @deprecated use {@link Launcher.toggle} instead
 */
export function toggleLauncher(open?: boolean) {
  Launcher.toggle(open);
}

/**
 * @deprecated use {@link Launcher.addItems} instead
 */
export function addLaunchItems(items: LauncherItem[]) {
  Launcher.addItems(items);
}
