import { type createBrowserRouter } from 'react-router-dom';
import { createStore } from 'zustand';
import { type RouteObjects } from '../../router';
import { type Module } from './Module';

export interface IModuleStore {
  router: ReturnType<typeof createBrowserRouter>;
  routes: RouteObjects;
  modules: Module[];
}

const createModuleSystemStore = (): IModuleStore => {
  return {
    // after init always defined
    router: undefined as any as ReturnType<typeof createBrowserRouter>,
    routes: [],
    modules: [],
  };
};
const ModuleStore = createStore<IModuleStore>(createModuleSystemStore);

export function getModuleStore() {
  return ModuleStore;
}
