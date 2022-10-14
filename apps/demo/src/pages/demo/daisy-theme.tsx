import { useEffect } from 'react';
import classNames from 'classnames';
import { useImmer } from 'use-immer';
import { useSnapshot } from 'valtio';
import { daisy, IntentType, SizeType } from '@src/daisy/daisy';
import { ThemeListSelector } from '@src/daisy/theme/ThemeListSelector';
import { hookThemeState, useThemeState } from '@src/daisy/theme/useTheme';
import { HSLToRGB } from '@src/utils/hsl';

const Page = () => {
  const state = useThemeState();
  useEffect(() => {
    return hookThemeState({ state });
  }, []);
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
      <Demo />
    </div>
  );
};

const Demo = () => {
  const [state, update] = useImmer<{ size?: SizeType; intent?: IntentType }>({
    size: undefined,
    intent: undefined,
  });
  const { size, intent } = state;
  let ex = daisy('btn', { size, intent });
  return (
    <div className={'flex flex-col justify-center gap-4 py-4'}>
      <h3 className={'text-xl font-medium'}>Demo</h3>
      <div>
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-sm btn-outline m-1">
            {state.size || 'Size'}
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li onClick={() => update({ ...state, size: undefined })}>
              <a>Default</a>
            </li>
            {sizes.map((v) => {
              return (
                <li key={v} onClick={() => update({ ...state, size: v })}>
                  <a>{v}</a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="dropdown">
          <label tabIndex={0} className={`btn btn-sm btn-outline m-1 ${daisy('btn', { intent })}`}>
            {state.intent || 'Intent'}
          </label>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li onClick={() => update({ ...state, intent: undefined })}>
              <a>Default</a>
            </li>
            {intents.map((v) => {
              return (
                <li key={v} onClick={() => update({ ...state, intent: v })}>
                  <a>{v}</a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className={'flex flex-wrap [&>div]:px-4'}>
        <div className={'flex gap-2 flex-col'}>
          <div className="divider">Button</div>
          <div className={'flex gap-2 flex-wrap'}>
            {intents.map((v) => (
              <button key={v} className={`btn btn-${v} ${daisy('btn', { size })}`}>
                {v}
              </button>
            ))}
          </div>
          <div className={'flex gap-2 flex-wrap'}>
            {sizes.map((v) => (
              <button key={v} className={`btn btn-${v} ${daisy('btn', { intent })}`}>
                {v}
              </button>
            ))}
          </div>
          <div className={'flex gap-2 flex-wrap'}>
            <button className={`btn btn-outline ${ex}`}>outline</button>
            <button className={`btn glass ${ex}`}>glass</button>
            <button className={`btn btn-ghost ${ex}`}>ghost</button>
            <button className={`btn loading ${ex}`}>loading</button>
            <button className={`btn btn-link ${ex}`}>link</button>
            <button className={`btn btn-active ${ex}`}>active</button>
            <button className={`btn btn-disabled ${ex}`}>disabled</button>
            <button className={`btn btn-circle ${ex}`}>C</button>
            <button className={`btn btn-square ${ex}`}>S</button>
          </div>
        </div>

        <div>
          <div className="divider">link</div>
          <div className={'flex flex-col items-start'}>
            <a className="link">link</a>
            <a className="link link-primary">link-primary</a>
            <a className="link link-secondary">link-secondary</a>
            <a className="link link-accent">link-accent</a>
            <a className="link link-neutral">link-neutral</a>
            <a className="link link-hover">link-hover</a>
          </div>
        </div>

        <div>
          <div className="divider">tabs</div>
          <div className={'flex flex-col items-center gap-2'}>
            <div className="tabs">
              <a className="tab">Tab 1</a>
              <a className="tab tab-active">Tab 2</a>
              <a className="tab">Tab 3</a>
            </div>
            <div className="tabs">
              <a className="tab tab-bordered">tab-bordered</a>
              <a className="tab tab-bordered tab-active">Tab 2</a>
              <a className="tab tab-bordered">Tab 3</a>
            </div>
            <div className="tabs">
              <a className="tab tab-lifted">tab-lifted</a>
              <a className="tab tab-lifted tab-active">Tab 2</a>
              <a className="tab tab-lifted">Tab 3</a>
            </div>
            <div className="tabs tabs-boxed">
              <a className="tab">tabs-boxed</a>
              <a className="tab tab-active">Tab 2</a>
              <a className="tab">Tab 3</a>
            </div>
            {/*  size */}
            <div className="tabs">
              <a className="tab tab-xs tab-lifted">tab-xs</a>
              <a className="tab tab-xs tab-lifted tab-active">Tiny</a>
              <a className="tab tab-xs tab-lifted">Tiny</a>
            </div>
            <div className="tabs">
              <a className="tab tab-sm tab-lifted">tab-sm</a>
              <a className="tab tab-sm tab-lifted tab-active">Small</a>
              <a className="tab tab-sm tab-lifted">Small</a>
            </div>
            <div className="tabs">
              <a className="tab tab-lifted">Normal</a>
              <a className="tab tab-lifted tab-active">Normal</a>
              <a className="tab tab-lifted">Normal</a>
            </div>
            <div className="tabs">
              <a className="tab tab-lg tab-lifted">tab-lg</a>
              <a className="tab tab-lg tab-lifted tab-active">Large</a>
              <a className="tab tab-lg tab-lifted">Large</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const intents: IntentType[] = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
const sizes: SizeType[] = ['xs', 'sm', 'md', 'lg'];

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
    const props = Object.keys(ThemeStyleProps).reduce((acc, prop) => {
      acc[prop] = style.getPropertyValue(`--${prop}`).trim();
      return acc;
    }, {} as Record<string, string>);
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
            let rgb = HSLToRGB(...(value.split(/\s/).map((v) => parseFloat(v)) as [number, number, number]))
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
