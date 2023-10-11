import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgPinduoduoBrandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='red'
    className='PinduoduoBrandIcon_svg__icon'
    viewBox='0 0 1024 1024'
    {...props}
  >
    <path d='M205 81c10-9 21-17 33-24v343c-51-36-99-75-150-111L0 226 205 81zm-69 82c0 9-3 15-3 24-4 9 9 21 0 30l-18 39c-4 4-4 10 0 15 3 6 12 3 18 3 6 3 9 6 15 6s9-3 15-3 12 3 15 0c3 0 6-3 12-6h15c6-3 6-12 3-18-10-10-18-21-24-33-9-12 6-27 0-39-3-3-3-12-3-18h-6c-3 7-8 14-15 18-8-3-15-8-18-15 0-4-3-4-6-4v1zM256 57c30 21 60 42 93 63l154 109c-6 3-11 7-15 12-76 51-151 105-229 157-3-112-3-226-3-341zm24 130 12 21 9-3v72c27 3 55 3 82 0v-72l9 3c6-7 12-15 15-24-15-3-30-12-45-15-4 9-12 15-22 15-9 0-15-9-18-15-14 4-28 10-42 18zm241 45c81-60 166-118 247-175v341L521 232zm132-69c-4 14-4 30 0 45 6 15 21 24 30 36 7 6 4 15 4 21-9 3-17 7-24 12h54c-9-3-15-9-24-12 0-6-3-18 3-21 13-9 23-22 30-36 6-15 0-30-3-45h-70zM783 57l63 45 151 106 27 18c-81 57-160 114-241 175V57zm45 94c3 11 11 20 21 24h18c-3-6-3-16-9-18-9-10-21-7-30-7zm48 9-9 15c6 0 15 0 18-3 4-5 7-10 9-16-6 0-12 1-18 4zm-18 21c-27 4-46 30-42 58v2c4 26 28 44 54 42 14-2 27-8 37-18 11-15 15-36 9-54a57 57 0 0 0-58-30zm-66 235 232-169v340L792 419s-3-4 0-4v1zm124-34c-20 3-37 16-46 34-3 12 10 18 16 27 9 8 20 13 33 15 8 7 17 13 27 18l3-24 30-21c9 3 15 12 21 15 3 0 9 0 9-3 0-8-2-15-6-21 4-7 6-14 6-22 0-6-6-9-12-6-6 4-11 9-15 15-12-5-21-15-33-21v-24c-15 0-24 12-33 18zM0 250l232 169c3 0 0 3 0 3C154 476 78 533 0 587V250zm69 117c-2 6-5 11-9 15-3 4-7 6-12 7-8 6-12 16-12 27-3 9-3 20 0 30 1 9 9 15 18 15h69c6 0 11-2 15-6 6-6 4-18 4-27-2-13-5-25-10-36l-18-12c-2-11-10-19-21-22-8 1-17 4-24 9zm350-21c12-15 15-33 24-48l21 45c6 0 12 3 21 3v18c9-3 18-3 30-6-6-21-15-42-21-60 21 9 39 15 57 24-6 12-9 27-15 42 9-3 18-3 24-6 3 0 3-3 6-6 8-17 16-35 21-54 15 9 27 21 42 30l-9 9c-9 9-21 15-30 24h39l9 30h-23l-10 40c12 1 23 4 34 9 5 9 10 19 12 30-12 3-27 3-40 6l-9 63c-6 6-13 11-21 15l-15-81-27-3c-6 21-9 45-15 66-6 9-15 9-24 15l-3-78c-7 0-13-1-18-3l-9-24c-12 12-10 30-12 45l-10 60-48-36 30-9-6-45-18 12c-6-15-9-34-15-48 12-1 23-3 34-6 0-12-4-22-4-34l-9-3-18-30c9 0 17-2 24-6h1zm39 76h30l-9 18 27-10c-3-9-3-21-6-30l-18-6c-6-6-6-12-9-18-12 9-12 27-15 46zm87-25c-3 12-3 25-6 37 12-4 21-4 33-6 0-12-3-25-3-34l-24 3zM84 367c9-3 18 6 21 15H69c6-5 9-11 15-15zm449 241 235-171v343l-72-54c-55-39-109-82-163-118zm142-69c-3 6-3 15-6 21l18-6c10-2 21 0 30 6-3-6-3-15-6-21h-36zm6 27c-13 4-22 13-27 24-5 18 2 36 18 45 14 9 33 7 45-5a36 36 0 0 0-9-61c-9-6-18-3-27-3zm-12 78c3 6 3 16 6 22h33l6-22c-12 10-30 7-45 0zm114-210 241 168-127 91-111 81c-3-111-3-226-3-340zm78 96v24h9c3-6 0-9 0-15 6-9-6-6-9-9zm-33 3v21l9 3c-3-9 6-24-9-24zm69 0c-3 6 0 12 0 18 0 3 10 3 10 0 3-6 0-12 0-18h-10zm-78 33v87c0 3 6 6 9 6h69c7 0 13 3 16-3 2-5 3-12 3-18l15-6c9-7 12-20 6-30-6-8-15-13-24-15v-21h-94zM0 602c78-54 157-111 238-165v340c-48-33-93-69-142-105-33-24-66-46-96-70zm199-57c-6 9-15 15-18 24-9 15-12 33-24 48-18 6-42 6-57 24 17 13 39 16 60 9 12-3 15-15 18-24 1-11 6-22 15-30 3-3 6 3 6 6v51h6c0-17-3-39 6-57 5-9 7-19 6-30-4-9-10-16-18-21zm57-108c48 33 93 66 139 102 30 24 63 45 93 69-78 58-157 115-232 172V437zm66 111c-6 3-6 9-12 12l-24 3c-3 0-6 6-6 9v70c0 6 9 6 12 6h99c7 0 7-6 7-12v-70c-9-5-18-7-28-6-3-5-9-10-15-12h-33zm-57 244c81-57 160-114 241-169v181c3 54 0 108 0 160-57-40-111-82-169-121l-72-51zm151-66h12c-3-3-3-6-6-6l-6 6zm-42 27c-8 11-14 23-18 36l12-3c9 0 18 3 24 0s14-3 21 0l-3 48c0 6-9 6-12 6l-9-18c-4 3-6 3-6 6-2 11 5 21 15 24 11 4 23-3 27-14v-52c9-2 19-1 27 3 11-3 22-3 33 0-2-12-7-24-15-33-6-7-13-12-21-15a54 54 0 0 0-76 12zm147-130 241 169-238 175c-3-118-3-232-3-343v-1zm78 97c-3 3-3 9-9 9l-27 21c4 2 8 4 12 3h66c-6-9-15-12-21-18-9-6-15-12-21-15zm-36 45v63c0 3 0 9 6 9h69c3-9 4-18 3-27v-45c1-3-5-3-9-3-23-1-46 0-69 3z' />
  </svg>
);
const Memo = memo(SvgPinduoduoBrandIcon);
export default Memo;
