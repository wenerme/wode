import { mutative } from '@wener/reaction/mutative/zustand';
import { getGlobalThis } from '@wener/utils';
import { createStore } from 'zustand';
import type { MatomoTracker } from './types';

function setupMatomo({
  global = getGlobalThis(),
  url,
  siteId,
  queue = [],
}: {
  global?: any;
  siteId?: string;
  url?: string;
  queue?: any[];
} = {}) {
  if (!url || !siteId) {
    return;
  }
  const G = global;
  if (typeof G === 'undefined' || G['Matomo']?.initialized) {
    return;
  }
  const _paq = (G._paq = G._paq || queue);
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  const u = url;
  _paq.push(['setTrackerUrl', u + 'matomo.php']);
  _paq.push(['setSiteId', siteId]);

  return new Promise((resolve, reject) => {
    const doc = document;
    const ele$ = doc.createElement('script');
    const parent$ = doc.getElementsByTagName('script')[0];
    ele$.onload = () => {
      resolve(window.Matomo);
    };
    ele$.onerror = reject;
    ele$.type = 'text/javascript';
    ele$.async = true;
    ele$.defer = true;
    ele$.src = u + 'matomo.js';
    parent$.parentNode?.insertBefore(ele$, parent$);
  });
}

interface TrackerStoreState {
  tracker: MatomoTracker;
  init: (o: { baseUrl?: string; siteId?: string }) => void;
}

export const TrackerStore = createStore<TrackerStoreState>()(
  mutative((setState, getState, store) => {
    const g: any = getGlobalThis();
    const queue: any[] = [];
    let pending;
    return {
      init: ({ baseUrl, siteId }) => {
        pending ||= setupMatomo({
          url: baseUrl,
          siteId: siteId,
        });
      },
      tracker: createProxyTracker({
        queue,
        invoke: ({ method, args }) => {},
      }),
    } as TrackerStoreState;
  }),
);

function createProxyTracker({
  queue = [],
  invoke,
}: {
  queue?: any[];
  invoke?: (o: { method: string; args: any[]; queue: any[] }) => void | boolean;
}): MatomoTracker {
  return new Proxy(
    {
      _paq: queue,
    },
    {
      get(target, prop) {
        switch (prop) {
          case '_paq':
            return target._paq;
        }
        return (...args: any[]) => {
          switch (prop) {
            case 'push':
              queue.push(...args);
              return;
            default:
              if (typeof prop !== 'string') {
                throw new Error(`Invalid tracker method ${String(prop)}`);
              }
          }
          let skip = false;
          if (invoke) {
            skip = invoke?.({ method: prop, args, queue }) === true;
          }
          if (!skip) {
            queue.push([prop, ...args]);
          }
          // Limit queue size
          if (queue.length > 1000) {
            queue.splice(0, 1000 - queue.length);
          }
        };
      },
    },
  ) as any;
}

export function getTracker(): MatomoTracker {
  return TrackerStore.getState().tracker;
}
