import type { SVGProps } from 'react';
import * as React from 'react';
import { memo } from 'react';

const SvgWechatBrandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1025 1024' {...props}>
    <path
      fill='#51C332'
      d='M1024 695c0-150-143-272-319-272-177 0-320 122-320 272s143 271 320 271c55 0 107-12 153-33l126 54-15-140c35-43 55-96 55-152zm-427-74a45 45 0 1 1 0-91 45 45 0 0 1 0 91zm215 0a45 45 0 1 1 0-91 45 45 0 0 1 0 91zM705 387c49 0 96 9 139 25l1-17c0-198-189-358-423-358C189 37 0 197 0 395c0 75 27 144 73 201L53 782l167-72c41 19 87 32 135 39-4-18-6-36-6-54 0-170 160-307 356-307zM565 178a60 60 0 1 1 0 120 60 60 0 0 1 0-120zM280 298a60 60 0 1 1 0-120 60 60 0 0 1 0 120z'
    />
  </svg>
);
const Memo = memo(SvgWechatBrandIcon);
export default Memo;
