// import { useState, type FC, type PropsWithChildren } from 'react';
// import { useAsyncEffect } from '@wener/reaction';
// import type { AppConf } from '../state';
// import { LoadingIndicator } from './components';
// import { getAppState } from './container';
//
// export const AppConfLoader: FC<
//   PropsWithChildren & {
//     load?: () => Promise<AppConf | undefined>;
//   }
// > = ({ children, load }) => {
//   const [init, setInit] = useState(!load);
//   const [error, setError] = useState<any>(undefined);
//   useAsyncEffect(async () => {
//     if (!load) return;
//     try {
//       let cfg = await load();
//       if (cfg) {
//         getAppState().loadConf(cfg);
//       }
//     } catch (e) {
//       setError(e);
//       return;
//     }
//     setTimeout(() => {
//       setInit(true);
//     }, 0);
//   }, []);
//
//   if (!init) {
//     return <LoadingIndicator title={'Loading app conf'} error={error} />;
//   }
//
//   return children;
// };

export {};
