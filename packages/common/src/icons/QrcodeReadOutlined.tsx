import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgQrcodeReadOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" {...props}>
    <path d="M651.357 260.67v-74.86h93.417v93.416h278.97V.256h-92.777v92.777h-93.416V.256H558.58v268.093c25.593-5.759 51.826-8.318 78.7-8.318 4.479 0 9.597 0 14.076.64zm279.29 111.589h93.097v93.097h-93.097zM186.13 744.518h93.097v93.097H186.13z" />
    <path d="M372.387 929.944H92.777v-278.33h167.638c-.64-4.48-.64-9.599-.64-14.077 0-27.514 3.2-53.747 8.958-79.34H0V1024h465.164v-50.547c-34.552-17.916-65.904-40.31-92.777-67.184v23.675zM186.129 186.129h93.097v93.097H186.13z" />
    <path d="M369.188 372.003H92.777V93.033h279.61v275.77c26.873-26.872 58.225-49.267 92.777-67.182V.256H0V465.42h301.365c17.915-34.552 40.95-65.904 67.823-93.417zM889.25 812.469a303.732 303.732 0 0 0 55.154-174.932c0-169.366-137.758-307.124-307.123-307.124a307.443 307.443 0 0 0-307.124 307.124 307.315 307.315 0 0 0 307.124 306.995 303.924 303.924 0 0 0 175.06-55.154l118.498 118.562a54.514 54.514 0 0 0 92.905-38.646 53.619 53.619 0 0 0-15.996-38.263L889.25 812.47zm-251.905 58.673a233.862 233.862 0 0 1-233.606-233.605 233.926 233.926 0 0 1 233.606-233.734 233.99 233.99 0 0 1 233.733 233.734 233.99 233.99 0 0 1-233.733 233.605z" />
    <path d="M372.387 372.003v-3.2l-3.2 3.2h3.2zm235.397 328.622L560.5 635.04l-76.845 110.053h307.507l-92.265-172.949zM560.5 591.34a30.776 30.776 0 1 0 0-61.552 30.776 30.776 0 0 0 0 61.552z" />
  </svg>
);

const Memo = memo(SvgQrcodeReadOutlined);
export default Memo;
