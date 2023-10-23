import { createContext, ReactNode, ReactPortal, useContext } from 'react';
import { createPortal } from 'react-dom';
import { getGlobalThis } from '@wener/utils';

const ContainerContext = createContext<HTMLElement | null>(null);

export const ContainerProvider = ContainerContext.Provider;

export interface UseContainer {
  container: HTMLElement;

  createPortal(children: ReactNode, container: HTMLElement, key?: null | string): ReactPortal | undefined;

  createPortal(children: ReactNode, key?: null | string): ReactPortal | undefined;
}

export function useContainer(ele?: HTMLElement): UseContainer {
  let ctx = useContext(ContainerContext);
  let container: HTMLElement = ele || ctx || getGlobalThis().document?.body;

  // maybe Element | DocumentFragment
  return {
    container,
    createPortal(children: ReactNode, _container?: HTMLElement | null | string, key?: null | string) {
      if (typeof window === 'undefined') {
        return undefined;
      }
      if (typeof _container === 'string') {
        key = _container;
        _container = undefined;
      }
      return createPortal(children, _container || container, key);
    },
  };
}
