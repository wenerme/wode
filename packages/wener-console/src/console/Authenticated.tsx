// import { useEffect, useState, type FC, type PropsWithChildren } from 'react';
// import Splash from '../assets/LoginSplash.jpg';
// import { AuthStatus } from '../state';
// import { Image, SiteLogo } from '../web';
// import { getAppState, getAppStore } from './container';
// import { LoginPage, type LoginFormData } from './pages';
//
// export const Authenticated: FC<
//   PropsWithChildren & {
//     onLogin?: (o: LoginFormData) => void;
//   }
// > = ({ children, onLogin }) => {
//   const [authed, setAuthed] = useState(() => {
//     return getAppState().auth.status === AuthStatus.Authenticated;
//   });
//
//   useEffect(() => {
//     // if (authed) return;
//     let store = getAppStore();
//     let unsub = store.subscribe((s) => {
//       if (s.auth.status === AuthStatus.Authenticated) {
//         setAuthed(true);
//       } else if (s.auth.status === AuthStatus.Unauthenticated) {
//         setAuthed(false);
//       }
//     });
//     return unsub;
//   }, []);
//
//   if (!authed) {
//     return <Auth onLogin={onLogin} />;
//   }
//   return <>{children}</>;
// };
//
// const Auth: FC<{ onLogin?: (o: LoginFormData) => void }> = ({ onLogin }) => {
//   const { title } = getAppState();
//   return (
//     <LoginPage
//       title={title}
//       logo={<SiteLogo className={'h-10 w-10'} />}
//       // showRegistry={false}
//       onSubmit={onLogin}
//       showoff={
//         // <img src={Splash} alt='splash' className='absolute inset-0 h-full w-full object-cover' />
//         <Image
//           className='absolute inset-0 h-full w-full object-cover'
//           // https://images.unsplash.com/photo-1496917756835-20cb06e75b4e
//           // src={'/static/login-splash.jpg'}
//           src={Splash}
//           // src={'https://images.unsplash.com/photo-1496917756835-20cb06e75b4e'}
//           alt={'splash'}
//         />
//       }
//     />
//   );
// };

export {};
