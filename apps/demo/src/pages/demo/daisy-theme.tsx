import { useEffect } from 'react';
import classNames from 'classnames';
import { useImmer } from 'use-immer';
import { useSnapshot } from 'valtio';
import { DaisyDemo } from '@src/daisy/theme/DaisyDemo';
import { ThemeListSelector } from '@src/daisy/theme/ThemeListSelector';
import { useThemeState } from '@src/daisy/theme/useTheme';
import { HSLToRGB } from '@src/utils/hsl';

const Page = () => {
  const state = useThemeState();
  const { theme, active } = useSnapshot(state);
  return (
    <div className={'container mx-auto'}>
      <div className={'p-2'}>
        <button
          type={'button'}
          className={classNames('btn btn-outline', theme === 'system' && 'active')}
          onClick={() => (state.theme = 'system')}
        >
          Follow System {theme === 'system' && <span className={'badge badge-primary'}>{active}</span>}
        </button>
      </div>
      <hr />
      <ThemeListSelector />
      <hr />
      <div>
        <h3 className={'text-xl font-medium'}>Theme</h3>
        <ThemeDetails />
      </div>
      <hr />
      <DaisyDemo />
    </div>
  );
};

const ThemeStyleProps: Record<string, { name?: string; description?: string; preview?: React.ReactNode }> = {
  p: { name: 'primary' },
  pf: { name: 'primary-focus' },
  pc: { name: 'primary-content' },
  s: { name: 'secondary' },
  sf: { name: 'secondary-focus' },
  sc: { name: 'secondary-content' },
  a: { name: 'accent' },
  af: { name: 'accent-focus' },
  ac: { name: 'accent-content' },
  n: { name: 'neutral' },
  nf: { name: 'neutral-focus' },
  nc: { name: 'neutral-content' },
  b1: { name: 'base-100' },
  b2: { name: 'base-200' },
  b3: { name: 'base-300' },
  bc: { name: 'base-content' },
  in: { name: 'info' },
  inc: { name: 'info-content' },
  su: { name: 'success' },
  suc: { name: 'success-content' },
  wa: { name: 'warning' },
  wac: { name: 'warning-content' },
  er: { name: 'error' },
  erc: { name: 'error-content' },

  'animation-btn': {},
  'animation-input': {},
  'border-btn': {
    preview: <button className={'btn btn-xs btn-outline'}>btn-outline</button>,
  },
  'btn-focus-scale': {},
  'btn-text-case': {
    preview: <button className={'btn btn-xs'}>hello world</button>,
  },
  'rounded-badge': {
    preview: <span className="badge badge-xs">Badge</span>,
  },
  'rounded-box': {},
  'rounded-btn': {},
  'tab-border': {
    preview: (
      <div className="tabs">
        <a className="tab tab-xs tab-lifted">A</a>
        <a className="tab tab-xs tab-lifted tab-active">B</a>
        <a className="tab tab-xs tab-lifted">C</a>
      </div>
    ),
  },
  'tab-radius': {},
};

const safelist = ['btn-info'];

const ThemeDetails = () => {
  const state = useThemeState();
  const { active } = useSnapshot(state);
  const [props, updateProps] = useImmer<Record<string, string>>({});
  useEffect(() => {
    const ele = document.documentElement;
    const style = getComputedStyle(ele);
    const props = Object.keys(ThemeStyleProps).reduce<Record<string, string>>((acc, prop) => {
      acc[prop] = style.getPropertyValue(`--${prop}`).trim();
      return acc;
    }, {});
    updateProps(props);
  }, [active]);
  return (
    <div>
      <table className={'table w-full table-compact'}>
        <thead>
          <tr>
            <th>Preview</th>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(props).map((prop) => {
            const { name = prop, preview } = ThemeStyleProps[prop] || {};
            const isColor = prop.length <= 3;
            const value = props[prop];
            const rgb = HSLToRGB(...(value.split(/\s/).map((v) => parseFloat(v)) as [number, number, number]))
              .map((v) => v.toString(16).padStart(2, '0'))
              .join('');
            return (
              <tr key={prop}>
                <td>
                  {isColor && <div className={'w-5 h-5 border rounded'} style={{ backgroundColor: `hsl(${value})` }} />}
                  {preview}
                </td>
                <td>
                  <div>{name}</div>
                  <small className={'text-neutral/50'}>--{prop}</small>
                </td>
                <td>
                  <div>{value}</div>
                  {isColor && <small className={'text-neutral/50 font-mono'}>#{rgb}</small>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
