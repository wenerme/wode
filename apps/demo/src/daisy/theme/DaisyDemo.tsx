import { useImmer } from 'use-immer';
import type { IntentType, SizeType } from '@src/daisy/daisy';
import { daisy } from '@src/daisy/daisy';

export const DaisyDemo = () => {
  const [state, update] = useImmer<{ size?: SizeType; intent?: IntentType }>({
    size: undefined,
    intent: undefined,
  });
  const { size, intent } = state;
  const btnEx = daisy('btn', { size, intent });
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
          <div className="divider">button</div>
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
            <button className={`btn btn-outline ${btnEx}`}>outline</button>
            <button className={`btn glass ${btnEx}`}>glass</button>
            <button className={`btn btn-ghost ${btnEx}`}>ghost</button>
            <button className={`btn loading ${btnEx}`}>loading</button>
            <button className={`btn btn-link ${btnEx}`}>link</button>
            <button className={`btn btn-active ${btnEx}`}>active</button>
            <button className={`btn btn-disabled ${btnEx}`}>disabled</button>
            <button className={`btn btn-circle ${btnEx}`}>C</button>
            <button className={`btn btn-square ${btnEx}`}>S</button>
          </div>
        </div>

        <div className={'flex flex-wrap flex-col gap-2'}>
          <div className="divider">badge</div>
          <div className={'flex flex-wrap gap-2'}>
            <div className="badge">neutral</div>
            <div className="badge badge-primary">primary</div>
            <div className="badge badge-secondary">secondary</div>
            <div className="badge badge-accent">accent</div>
            <div className="badge badge-ghost">ghost</div>
            <div className="badge badge-info">info</div>
            <div className="badge badge-success">success</div>
            <div className="badge badge-warning">warning</div>
            <div className="badge badge-error">error</div>
          </div>
          <div className={'flex flex-wrap gap-2'}>
            <div className="badge badge-lg">lg</div>
            <div className="badge badge-md">md</div>
            <div className="badge badge-sm">sm</div>
            <div className="badge badge-xs">xs</div>
          </div>
          <div>
            <div className="badge badge-outline">outline</div>
          </div>
        </div>

        <div className={'flex flex-wrap flex-col gap-2 [&>div]:flex [&>div]:gap-2'}>
          <div className="divider">checkbox</div>
          <div>
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <input type="checkbox" defaultChecked className="checkbox checkbox-secondary" />
            <input type="checkbox" defaultChecked className="checkbox checkbox-accent" />
          </div>
          <div>
            <input type="checkbox" defaultChecked className="checkbox checkbox-xs" />
            <input type="checkbox" defaultChecked className="checkbox checkbox-sm" />
            <input type="checkbox" defaultChecked className="checkbox checkbox-md" />
            <input type="checkbox" defaultChecked className="checkbox checkbox-lg" />
          </div>
          <div>
            <input type="checkbox" className="checkbox" disabled />
            <input type="checkbox" className="checkbox" disabled defaultChecked />
          </div>
        </div>

        <div className={'flex flex-wrap flex-col gap-2 [&>div]:flex [&>div]:gap-2'}>
          <div className="divider">radio</div>
          <div>
            <input type="radio" defaultChecked className="radio radio-primary" />
            <input type="radio" defaultChecked className="radio radio-secondary" />
            <input type="radio" defaultChecked className="radio radio-accent" />
          </div>
          <div>
            <input type="radio" defaultChecked className="radio radio-xs" />
            <input type="radio" defaultChecked className="radio radio-sm" />
            <input type="radio" defaultChecked className="radio radio-md" />
            <input type="radio" defaultChecked className="radio radio-lg" />
          </div>
          <div>
            <input type="radio" className="radio" disabled />
            <input type="radio" className="radio" disabled defaultChecked />
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

        <div>
          <div className="divider">progress</div>
          <div className={'flex flex-col gap-2'}>
            <progress className="progress w-56" value="0" max="100"></progress>
            <progress className="progress w-56 progress-primary" value="10" max="100"></progress>
            <progress className="progress w-56 progress-secondary" value="25" max="100"></progress>
            <progress className="progress w-56 progress-accent" value="40" max="100"></progress>
            <progress className="progress w-56 progress-info" value="55" max="100"></progress>
            <progress className="progress w-56 progress-success" value="70" max="100"></progress>
            <progress className="progress w-56 progress-warning" value="85" max="100"></progress>
            <progress className="progress w-56 progress-error" value="100" max="100"></progress>
          </div>
        </div>
        <div>
          <div className="divider">radial-progress</div>
          <div className={'flex gap-2 flex-wrap'}>
            <div className="radial-progress" style={{ '--value': 0 }}>
              0%
            </div>
            <div className="radial-progress" style={{ '--value': 10 }}>
              10%
            </div>
            <div className="radial-progress text-primary" style={{ '--value': 30 }}>
              primary
            </div>
            <div
              className="radial-progress bg-primary text-primary-content border-4 border-primary"
              style={{ '--value': 35 }}
            >
              35%
            </div>
            <div
              className="radial-progress text-info"
              style={{ '--value': 40, '--size': '10rem', '--thickness': '2px' }}
            >
              10rem/2px
            </div>
            <div className="radial-progress" style={{ '--value': 40, '--size': '10rem', '--thickness': '2rem' }}>
              10rem/2rem
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const intents: IntentType[] = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'];
const sizes: SizeType[] = ['xs', 'sm', 'md', 'lg'];
