import React from 'react';
import classNames from 'classnames';

const Colors = {
  primary: ['bg-primary', 'text-primary-content'],
  secondary: ['bg-secondary', 'text-secondary-content'],
  accent: ['bg-accent', 'text-accent-content'],
  neutral: ['bg-neutral', 'text-neutral-content'],
  info: ['bg-info', 'text-info-content'],
  success: ['bg-success', 'text-success-content'],
  warning: ['bg-warning', 'text-warning-content'],
  error: ['bg-error', 'text-error-content'],
};
export const ThemePreviewCard: React.FC<{ title?: string }> = ({ title }) => {
  return (
    <div className="grid grid-cols-5 grid-rows-4">
      <div className="col-start-1 row-span-2 row-start-1 bg-base-200"></div>
      <div className="col-start-1 row-start-3 row-span-2 bg-base-300"></div>
      <div className="col-span-4 col-start-2 row-span-4 row-start-1 flex flex-col gap-1 bg-base-100 p-2">
        <div className="font-bold">{title}</div>
        <div className="grid grid-cols-4 gap-1">
          {Object.entries(Colors).map(([name, [bg, content]]) => (
            <div
              key={name}
              title={name}
              className={classNames('flex aspect-square w-5 items-center justify-center rounded bg-primary lg:w-6', bg)}
            >
              <div className={classNames('text-sm font-bold', content)}>{name[0].toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
