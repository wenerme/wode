import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgQrcodePrintOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 1024 1024' {...props}>
    <path d='M794.88 255.936h64.064V320H794.88z' />
    <path d='M602.688 320h128.128v-64.064H602.688V127.68h64.32v64.256H858.88V0h-63.808v63.808h-64.256V0H538.88v320h52.608zM293.824 127.872h64v64h-64z' />
    <path d='M373.056 320H485.76V0h-320v320zm-143.488-64.256V63.808h192.32V255.68h-192.32zM961.6 373.312H57.28c-30.72 2.56-55.04 27.52-56.96 57.6v220.736c1.92 29.44 23.68 53.12 50.56 57.6h87.68v-64.64H64.32V437.312h895.36v207.296h-73.6v64.64h82.56c29.44-3.2 52.48-27.52 55.68-55.68V427.712a64 64 0 0 0-62.72-54.4M482.688 840.448l-47.296-65.6-76.864 110.08h307.584l-92.288-172.992z' />
    <path d='M435.392 731.136a30.784 30.784 0 1 0 0-61.568 30.784 30.784 0 0 0 0 61.568' />
    <path d='M192.32 966.4c1.92 30.08 26.24 55.04 56.96 57.6H769.6a64 64 0 0 0 62.72-54.4V512h-640zm64-389.76h511.36V960H256.32zm666.432-73.472a30.72 30.72 0 1 0-61.504 0 30.72 30.72 0 0 0 61.504 0' />
  </svg>
);
const Memo = memo(SvgQrcodePrintOutlined);
export default Memo;
