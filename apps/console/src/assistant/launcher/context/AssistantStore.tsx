import { use, type ReactNode } from 'react';
import { createReactContext } from '@wener/reaction';
import { createBoundedUseStore } from '@wener/reaction/zustand';
import { create, type ExtractState } from 'zustand';
import { mutative } from 'zustand-mutative';
import type { AssistantTool } from '../types';
import { WodeAssistantSidecar } from '../sidecar/WodeAssistantSidecar';

export interface UserInfo {
    name: string;
    username: string;
}

export interface AssistantStoreState {
    tools: AssistantTool[];
    activeToolId?: string;
    searchQuery: string;

    // Global State
    user?: UserInfo;
    version: string;
    sidecar: WodeAssistantSidecar;

    actions: AssistantActions;
}

export interface AssistantActions {
    setTools: (tools: AssistantTool[]) => void;
    setActiveToolId: (id: string) => void;
    setSearchQuery: (query: string) => void;
    registerTool: (tool: AssistantTool) => void;

    // Global Actions
    setUser: (user: UserInfo) => void;
}

export type AssistantStore = ReturnType<typeof createAssistantStore>;

export function createAssistantStore(initialState: Partial<Omit<AssistantStoreState, 'actions'>> = {}) {
    return create(
        mutative<AssistantStoreState>((setState, getState) => {
            return {
                tools: [],
                activeToolId: undefined,
                searchQuery: '',
                version: '0.0.0',
                sidecar: new WodeAssistantSidecar(), // Default instance if not provided
                ...initialState,

                actions: {
                    setTools(tools) {
                        setState((state) => {
                            state.tools = tools;
                        });
                    },
                    setActiveToolId(id) {
                        setState((state) => {
                            state.activeToolId = id;
                        });
                    },
                    setSearchQuery(query) {
                        setState((state) => {
                            state.searchQuery = query;
                        });
                    },
                    registerTool(tool) {
                        setState((state) => {
                            // Avoid duplicates
                            if (!state.tools.find(t => t.id === tool.id)) {
                                state.tools.push(tool);
                            }
                        });
                    },
                    setUser(user) {
                        setState((state) => {
                            state.user = user;
                        });
                    }
                },
            };
        }),
    );
}

const AssistantContext = createReactContext<AssistantStore | undefined>('AssistantContext', undefined);

export function useAssistantStoreContext(): AssistantStore {
    const store = use(AssistantContext);
    if (!store) {
        throw new Error('AssistantStore not found in context');
    }
    return store;
}

type UseAssistantStore = {
    (): ExtractState<AssistantStore>;
    <T>(selector: (state: ExtractState<AssistantStore>) => T): T;
};

export const useAssistantStore: UseAssistantStore = createBoundedUseStore(useAssistantStoreContext) as UseAssistantStore;

export function useAssistantActions() {
    return useAssistantStore((s) => s.actions);
}

export interface AssistantProviderProps {
    store: AssistantStore;
    children: ReactNode;
}

export function AssistantProvider({ store, children }: AssistantProviderProps) {
    return <AssistantContext.Provider value={store}>{children}</AssistantContext.Provider>;
}
