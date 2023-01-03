import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgBarcodePrintOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" {...props}>
    <path d="M955.1 192.22H833.974V94.5c0-44.47-22.674-90.477-67.145-90.477H282.624c-44.47 0-93.623 46.08-93.623 90.478v97.645H94.354c-44.47 0-93.476 46.08-93.476 90.697v295.863c0 44.471 48.932 70.29 93.476 70.29h94.647v301.642c0 44.617 49.152 69.924 93.623 69.924H766.83c44.47 0 67.072-25.38 67.072-69.924V648.923h121.27c44.618 0 68.097-25.746 68.097-70.29v-295.79c0-44.47-23.552-90.624-68.096-90.624M245.394 94.72c0-14.629 24.796-37.45 39.497-37.45h479.306c14.774 0 13.312 22.821 13.312 37.45v96.695H245.394V94.72M777.51 938.423a26.917 26.917 0 0 1-26.332 27.282H271.872a27.136 27.136 0 0 1-26.478-27.282V543.45c0-14.701 11.703-26.624 26.478-26.624h479.451a26.331 26.331 0 0 1 26.332 26.624v394.9m186.148-361.18c0 14.629 1.536 16.384-13.092 16.384H830.757v-43.008c0-44.105-22.382-90.039-66.56-90.039H284.89c-44.105 0-92.672 45.934-92.672 90.04v43.007H98.523c-14.774 0-39.35-1.755-39.35-16.384V284.233c0-14.628 24.576-36.571 39.35-36.571h852.188c14.628 0 13.092 21.796 13.092 36.571v293.01m-261.266 56.613H325.925a26.185 26.185 0 1 0 0 52.59H702.61a26.331 26.331 0 0 0 19.017-45.056 27.063 27.063 0 0 0-19.09-7.534m0 155.502H325.925a26.843 26.843 0 0 0-23.187 40.228 26.624 26.624 0 0 0 23.187 13.385H702.61a26.843 26.843 0 0 0 23.187-40.228 26.843 26.843 0 0 0-23.26-13.385m123.538-476.672a39.497 39.497 0 1 0 79.068 0 39.497 39.497 0 0 0-79.068 0" />
  </svg>
);

const Memo = memo(SvgBarcodePrintOutlined);
export default Memo;
