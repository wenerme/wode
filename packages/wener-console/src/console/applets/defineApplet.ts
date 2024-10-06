import { getRootWindow, type ReactWindow, type WindowOpenOptions } from '../../web/window';

export interface DefineAppletOptions {
  name: string;
  title: string;
  description?: string;
  version?: string;
  window: WindowOpenOptions;
  metadata?: Record<string, any>;
}

const applets: Applet[] = [];

export function defineApplet(opts: DefineAppletOptions) {
  const { window } = opts;
  window.key ||= opts.name;
  window.title ||= opts.title;
  let applet = new Applet(opts);
  applets.push(applet);
  return applet;
}

export function getApplets() {
  return applets;
}

class Applet {
  constructor(readonly options: DefineAppletOptions) {}

  window?: ReactWindow;

  toggle(opts: Partial<WindowOpenOptions> = {}) {
    if (this.window && this.window.state.minimized) {
      this.window.minimize(false);
      return;
    }
    this.window = getRootWindow().toggle({ ...this.options.window, ...opts });
  }
}
