import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgDarkModeFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 21 21' {...props}>
    <g fillRule='evenodd'>
      <circle cx={10.5} cy={10.5} r={10.5} />
      <path
        fill='#FFF'
        fillRule='nonzero'
        d='M13.396 11c0-3.019-1.832-5.584-4.394-6.566A6.4 6.4 0 0 1 11.304 4C15.002 4 18 7.135 18 11s-2.998 7-6.698 7A6.4 6.4 0 0 1 9 17.566c2.564-.98 4.396-3.545 4.396-6.566'
      />
    </g>
  </svg>
);
const Memo = memo(SvgDarkModeFilled);
export default Memo;
