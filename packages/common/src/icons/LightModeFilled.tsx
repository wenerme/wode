import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgLightModeFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 21 21' {...props}>
    <g fillRule='evenodd'>
      <path fillRule='nonzero' d='m21 10.5-3 3V18h-4.5l-3 3-3-3H3v-4.5l-3-3 3-3V3h4.5l3-3 3 3H18v4.5z' />
      <circle cx={10.5} cy={10.5} r={4} stroke='#FFF' strokeWidth={1.5} />
    </g>
  </svg>
);
const Memo = memo(SvgLightModeFilled);
export default Memo;
