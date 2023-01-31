import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgDingtalkBrandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" {...props}>
    <path
      fill="#3296FA"
      d="M908 382c-1 7-6 18-12 32v1c-36 76-129 226-129 226l-1-1-27 48h131l-250 334 57-227H573l36-151c-29 7-63 17-104 30 0 0-55 32-158-62 0 0-70-61-30-77 18-6 84-15 136-22l114-14s-217 3-269-5c-51-8-117-94-131-170 0 0-21-42 47-22s348 77 348 77-365-113-389-140c-25-27-72-149-66-224 0 0 3-19 22-14 0 0 270 123 455 191s345 102 324 190z"
    />
  </svg>
);
const Memo = memo(SvgDingtalkBrandIcon);
export default Memo;
