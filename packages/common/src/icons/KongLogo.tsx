import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgKongLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={142} height={128} {...props}>
    <path d="M46.628 105.188h26.064l13.533 17.015L83.898 128H50.225l.826-5.797-7.938-12.522 3.515-4.493zm18.65-74.751 13.969-.021 62.77 74.833L137.14 128h-26.903l1.675-6.41-58.655-69.944 12.021-21.209zM89.958 0l29.18 22.934-3.736 3.855 5.06 7.046v7.534l-14.548 11.859-24.465-28.904H67.205l5.735-10.512L89.957 0zM28.71 73.453l20.355-17.69 27.016 32.51-7.67 11.91H43.5l-17.234 22.615L22.33 128H0v-27.748l20.813-26.799h7.897z" />
  </svg>
);

const Memo = memo(SvgKongLogo);
export default Memo;
