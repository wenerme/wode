// import type { PropsWithChildren } from 'react';
// import React from 'react';
// import { CiEdit } from 'react-icons/ci';
// import { PiDotBold } from 'react-icons/pi';
// import { Link, useParams } from 'react-router-dom';
// import dayjs from 'dayjs';
// import { trpc } from '../../../dash/trpc/trpc';
// import { getUserProfileState } from '../../../dash/user/getUserProfileState';
//
// export const UserProfilePage: React.FC<PropsWithChildren> = () => {
//   const currentUserId = getUserProfileState().id;
//   const { userId } = useParams();
//   const { data } = trpc.user.profile.useQuery(
//     {
//       id: userId || '',
//     },
//     {
//       enabled: Boolean(userId),
//       suspense: true,
//     },
//   );
//   if (!data) {
//     return null;
//   }
//   const { id, fullName, loginName, joinDate, birthDate } = data;
//   return (
//     <div className={'flex min-h-full w-full flex-1 flex-col'}>
//       <div className={'p-2 text-sm font-medium'}>{fullName}</div>
//       <div className={'relative flex items-center justify-center border-y bg-base-200 py-4'}>
//         {id === currentUserId && (
//           <div className={'absolute right-0 top-0 pr-2 pt-2'}>
//             <Link to={'/setting/profile'} className={'btn btn-square btn-secondary btn-outline btn-sm'}>
//               <CiEdit />
//             </Link>
//           </div>
//         )}
//
//         <div className={'flex items-start gap-8'}>
//           <div>
//             <div className="avatar placeholder">
//               <div className="w-24 rounded-full bg-neutral-focus text-neutral-content">
//                 <span className="text-3xl">{fullName?.slice(0, 1)}</span>
//               </div>
//             </div>
//           </div>
//           <div className={'flex flex-col gap-2'}>
//             <div className={'text-2xl font-bold'}>{fullName}</div>
//             <div className={'flex items-center text-sm'}>
//               @{loginName}
//               {birthDate && (
//                 <>
//                   <PiDotBold className={'h-4 w-4'} /> 🎂 {dayjs(birthDate).format('MM月DD日')}
//                 </>
//               )}
//               {joinDate && (
//                 <>
//                   <PiDotBold className={'h-4 w-4'} /> 加入于 {dayjs(joinDate).format('YYYY年MM月DD日')}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//       <div>活动统计</div>
//       <div>活动详情</div>
//     </div>
//   );
// };

export const UserProfilePage = () => {
  return <div>UserProfilePage</div>;
};
