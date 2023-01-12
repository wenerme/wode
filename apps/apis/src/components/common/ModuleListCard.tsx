import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const ModuleListCard: React.FC<{
  items: Array<{ icon: ReactNode; title: ReactNode; href: string }>;
  figure?: ReactNode;
  action?: ReactNode;
  title?: ReactNode;
}> = ({ items, title, figure, action }) => {
  return (
    <div className="card card-side bg-base-100 shadow-xl border">
      {figure && <figure>{figure}</figure>}
      <div className="card-body">
        {title && <h2 className="card-title">{title}</h2>}
        <div className={'flex flex-wrap gap-6 py-2'}>
          {items.map(({ title, icon, href }) => {
            return (
              <Link className="group relative inline-block focus:outline-none focus:ring" key={href} to={href}>
                <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-blue-300 transition-transform group-hover:translate-y-0 group-hover:translate-x-0"></span>

                <span className="relative inline-block border-2 border-current px-8 py-3 text-sm font-bold uppercase tracking-widest text-black group-active:text-opacity-75">
                  {icon}
                  {title}
                </span>
              </Link>
            );
          })}
        </div>
        {action && <div className="card-actions justify-end">{action}</div>}
      </div>
    </div>
  );
};
