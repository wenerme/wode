import React, { createContext, useId, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const PortalProvider: React.FC<{
  children?: ReactNode;
  id?: string;
  container: HTMLElement;
}> = ({ children, id, container }) => {
  const _id = useId();
  const val = useMemo(() => {
    return { container, id: id || _id };
  }, [id, container, _id]);
  return <Context.Provider value={val}>{children}</Context.Provider>;
};

const Context = createContext<PortalContext | undefined>(undefined);

function usePortalContext() {
  const context = React.useContext(Context);
  if (!context) {
    return {
      id: '__ROOT__',
      container: document.body,
    };
  }
  return context;
}

export const Portal: React.FC<{ children?: ReactNode; id?: string }> = ({ children, id }) => {
  const _id = useId();
  return createPortal(children, usePortalContext().container, id || _id);
};

interface PortalContext {
  id: string;
  container: HTMLElement;
}

export function usePortal() {
  return usePortalContext();
}
