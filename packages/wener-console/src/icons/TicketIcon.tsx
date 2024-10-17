import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgTicketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='currentColor'
    className='TicketIcon_svg__icon'
    viewBox='0 0 1024 1024'
    {...props}
  >
    <path d='M224.26 763.863h-51.022m163.522 0h-14.965m65.986 0h-14.963m0 0H336.76m314.422 0H636.22m65.986 0H687.24m163.522 0H799.74m-112.5 0h-36.058m203.366-504.267H169.452a36.058 36.058 0 0 0-36.058 36.058v432.692a36.058 36.058 0 0 0 36.058 36.058h54.087l48.858-48.859 49.398 48.86h65.986l48.859-48.86 48.678 48.86h54.086l48.858-48.86 47.957 48.86h65.986l48.857-48.86 49.4 48.86h54.086a36.058 36.058 0 0 0 36.058-36.059V295.654a36.058 36.058 0 0 0-36.058-36.058zm0 450.722a18.029 18.029 0 0 1-18.029 18.028h-21.814l-63.823-63.822-63.642 63.822h-36.058l-63.822-63.822-63.641 63.822h-23.438l-63.822-63.822-63.641 63.822H336.76l-63.822-63.822-63.643 63.822h-21.814a18.029 18.029 0 0 1-18.029-18.028V313.682a18.029 18.029 0 0 1 18.029-18.028h649.038a18.029 18.029 0 0 1 18.029 18.028z' />
    <path d='m264.464 372.637 57.512 106.55 57.512-106.55h32.091l-66.166 116.467h48.317v16.226h-57.51v31.91h57.511v16.227H336.22v51.021h-28.666v-51.021H250.4V537.24h57.152v-31.73H250.4v-16.226h47.957l-66.165-116.647zm245.553 36.058H762.42v36.058H510.017zm0 126.201H762.42v36.058H510.017z' />
  </svg>
);
const Memo = memo(SvgTicketIcon);
export default Memo;
