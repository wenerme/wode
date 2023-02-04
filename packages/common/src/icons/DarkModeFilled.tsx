import * as React from 'react';
import { type SVGProps, memo } from 'react';

const SvgDarkModeFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" fill="currentColor" {...props}>
    <g fillRule="evenodd">
      <circle cx={10.5} cy={10.5} r={10.5} />
      <path
        fill="#FFF"
        fillRule="nonzero"
        d="M13.396 11c0-3.019-1.832-5.584-4.394-6.566A6.427 6.427 0 0 1 11.304 4C15.002 4 18 7.135 18 11c0 3.866-2.998 7-6.698 7A6.42 6.42 0 0 1 9 17.566c2.564-.98 4.396-3.545 4.396-6.566z"
      />
    </g>
  </svg>
);
const Memo = memo(SvgDarkModeFilled);
export default Memo;
