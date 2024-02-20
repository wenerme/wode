import { Link } from '@remix-run/react';

const links = [
  { text: 'Packages', href: '/package' },
  { text: 'Contents', href: '/content' },
  {
    text: 'More',
    children: [
      { text: 'Github', href: 'https://github.com/wenerme/wode' },
      { text: 'Author', href: '/author' },
    ],
  },
];

export const ApkiHeader = () => {
  return (
    <div className='navbar bg-base-100'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <div tabIndex={0} role='button' className='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 6h16M4 12h8m-8 6h16' />
            </svg>
          </div>
          <ul tabIndex={0} className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'>
            {links.map((link) => {
              return (
                <li key={link.text}>
                  {link.href ? (
                    <Link to={link.href}>{link.text}</Link>
                  ) : (
                    <>
                      <a>{link.text}</a>
                      <ul className='p-2'>
                        {link.children?.map((child) => {
                          return (
                            <li key={child.text}>
                              <Link to={child.href}>{child.text}</Link>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <Link to={'/'} className='btn btn-ghost text-xl'>
          Alpine/pkg/index
        </Link>
      </div>
      <div className='navbar-center hidden lg:flex'>
        <ul className='menu menu-horizontal px-1'>
          {links.map((link) => {
            return (
              <li key={link.text}>
                {link.href ? (
                  <Link to={link.href}>{link.text}</Link>
                ) : (
                  <details>
                    <summary>{link.text}</summary>
                    <ul className='p-2'>
                      {link.children?.map((child) => {
                        return (
                          <li key={child.text}>
                            <Link to={child.href}>{child.text}</Link>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className='navbar-end'></div>
    </div>
  );
};
