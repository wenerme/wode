import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgHashLockOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" {...props}>
    <path d="M57.184 29A2.996 2.996 0 0 0 60 31c1.654 0 3-1.346 3-3s-1.346-3-3-3a2.996 2.996 0 0 0-2.816 2H41a8.97 8.97 0 0 0-.232-2H51c.266 0 .52-.105.707-.293L55.414 21h1.77A2.996 2.996 0 0 0 60 23c1.654 0 3-1.346 3-3s-1.346-3-3-3a2.996 2.996 0 0 0-2.816 2H55a.996.996 0 0 0-.707.293L50.586 23H40.05A9.058 9.058 0 0 0 37 19.522v-4.828l7.352-2.757c.389-.147.648-.52.648-.937V6.816A2.996 2.996 0 0 0 47 4c0-1.654-1.346-3-3-3s-3 1.346-3 3c0 1.302.839 2.402 2 2.816v3.491l-6 2.25v-1.741A2.996 2.996 0 0 0 39 8c0-1.654-1.346-3-3-3s-3 1.346-3 3c0 1.302.839 2.402 2 2.816v7.709c-.94-.334-1.947-.525-3-.525s-2.06.191-3 .525V6.816A2.996 2.996 0 0 0 31 4c0-1.654-1.346-3-3-3s-3 1.346-3 3c0 1.302.839 2.402 2 2.816v12.706a9.06 9.06 0 0 0-2 1.834V13a.997.997 0 0 0-.293-.707L21 8.586v-1.77A2.996 2.996 0 0 0 23 4c0-1.654-1.346-3-3-3s-3 1.346-3 3c0 1.302.839 2.402 2 2.816V9c0 .265.105.52.293.707L23 13.414V27h-8.307l-2.757-7.351A1 1 0 0 0 11 19H6.816A2.996 2.996 0 0 0 4 17c-1.654 0-3 1.346-3 3s1.346 3 3 3a2.996 2.996 0 0 0 2.816-2h3.491l2.25 6h-1.741A2.996 2.996 0 0 0 8 25c-1.654 0-3 1.346-3 3s1.346 3 3 3a2.996 2.996 0 0 0 2.816-2H23v3h-1a1 1 0 0 0-1 1v2H6.816A2.996 2.996 0 0 0 4 33c-1.654 0-3 1.346-3 3s1.346 3 3 3a2.996 2.996 0 0 0 2.816-2H21v2h-8a.996.996 0 0 0-.707.293L8.586 43h-1.77A2.996 2.996 0 0 0 4 41c-1.654 0-3 1.346-3 3s1.346 3 3 3a2.996 2.996 0 0 0 2.816-2H9c.266 0 .52-.105.707-.293L13.414 41H21v4a1 1 0 0 0 1 1h5v3.307l-7.352 2.757A1 1 0 0 0 19 53v4.184A2.996 2.996 0 0 0 17 60c0 1.654 1.346 3 3 3s3-1.346 3-3a2.996 2.996 0 0 0-2-2.816v-3.491l6-2.25v1.741A2.996 2.996 0 0 0 25 56c0 1.654 1.346 3 3 3s3-1.346 3-3a2.996 2.996 0 0 0-2-2.816V46h6v11.184A2.996 2.996 0 0 0 33 60c0 1.654 1.346 3 3 3s3-1.346 3-3a2.996 2.996 0 0 0-2-2.816V46h2v5c0 .265.105.52.293.707L43 55.414v1.77A2.996 2.996 0 0 0 41 60c0 1.654 1.346 3 3 3s3-1.346 3-3a2.996 2.996 0 0 0-2-2.816V55a.997.997 0 0 0-.293-.707L41 50.586V46h1a1 1 0 0 0 1-1v-8h6.307l2.757 7.351A1 1 0 0 0 53 45h4.184A2.996 2.996 0 0 0 60 47c1.654 0 3-1.346 3-3s-1.346-3-3-3a2.996 2.996 0 0 0-2.816 2h-3.491l-2.25-6h1.741A2.996 2.996 0 0 0 56 39c1.654 0 3-1.346 3-3s-1.346-3-3-3a2.996 2.996 0 0 0-2.816 2H43v-2a1 1 0 0 0-1-1h-1v-3h16.184zM60 27a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zm0-8a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zM44 3a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zm-8 4a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zm-8-4a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zm-8 0a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zM4 21a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm4 8a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm-4 8a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm0 8a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm16 16a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm8-4a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm8 4a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm8 0a1.001 1.001 0 0 1 0-2 1.001 1.001 0 0 1 0 2zm16-18a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zm-4-8a1.001 1.001 0 1 1-1 1c0-.551.448-1 1-1zm-25 4a1.001 1.001 0 1 1 1 1c-.552 0-1-.449-1-1zm10 5h-8v-2.184A2.996 2.996 0 0 0 35 39c0-1.654-1.346-3-3-3s-3 1.346-3 3c0 1.302.839 2.402 2 2.816V44h-8V34h18v10zm-6-12h-6v-5c0-1.654 1.346-3 3-3s3 1.346 3 3v5zm2 0v-5c0-2.757-2.243-5-5-5s-5 2.243-5 5v5h-2v-5c0-3.86 3.141-7 7-7s7 3.14 7 7v5h-2z" />
  </svg>
);

const Memo = memo(SvgHashLockOutlined);
export default Memo;