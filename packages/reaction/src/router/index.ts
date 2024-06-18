export { useRouteTitles } from './useRouteTitles';
export { lazyRoute } from './lazyRoute';

// declare module 'react-router-dom' {
//   export interface IndexRouteObject {
//     meta?: KnownRouteObjectMeta;
//   }
//
//   export interface NonIndexRouteObject {
//     meta?: KnownRouteObjectMeta;
//   }
// }
//
// export interface KnownRouteObjectHandle {
//   title?: RouteHandleTitle;
//
//   [key: string]: any;
// }
//
// type RouteHandleTitle = string | ((data: any, match: UIMatch<unknown, KnownRouteObjectHandle>) => string);
//
// export interface KnownRouteObjectMeta {
//   id?: string;
//   title?: string;
//   icon?: ReactNode;
//   menu?: Record<string, any>;
//
//   [key: string]: any;
// }
//
// export type RouteObjects = RouteObject[];
