import React from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import { act, create } from 'react-test-renderer';
import test from 'ava';
import _ from 'lodash';
import { deserialize, serialize } from './serialize';

test('ele', (t) => {
  {
    const a = React.createElement('a', {});
    t.deepEqual(_.omit(a, ['_owner', '_store']), {
      type: 'a',
      props: {},
      key: null,
      ref: null,
      $$typeof: Symbol.for('react.element'),
    });
  }
  {
    const a = React.createElement(MemoComp, {});
    t.deepEqual(_.omit(a, ['_owner', '_store']), {
      type: MemoComp,
      props: {},
      key: null,
      ref: null,
      $$typeof: Symbol.for('react.element'),
    });
    t.deepEqual(a.type, {
      compare: null,
      $$typeof: Symbol.for('react.memo'),
      // original
      type: MemoComp.type,
    });
  }

  {
    const a = React.createElement('a', {}, 'hello');
    t.deepEqual(_.omit(a, ['_owner', '_store']), {
      type: 'a',
      props: {
        children: 'hello',
      },
      key: null,
      ref: null,
      $$typeof: Symbol.for('react.element'),
    });
  }

  // {
  //   const a = React.createElement(React.Fragment, {}, 'hello');
  //   t.log(a);
  // }

  {
    t.log(React.Fragment);
    const m = new Map();
    m.set(React.Fragment, 'F');
    t.log(m.get(React.Fragment));
  }
});

test('serialize', (t) => {
  {
    const so = { refs: new Map(), register: true };
    so.refs.set(React.Fragment, 'React.Fragment');
    so.refs.set(React.StrictMode, 'React.StrictMode');
    so.refs.set(Ctx.Provider, 'Ctx.Provider');
    so.refs.set(Ctx.Consumer, 'Ctx.Consumer');

    const a = (
      <C
        title={
          <h3 key={'kk'}>
            Hi <small>Nice</small>
          </h3>
        }
      >
        <Ctx.Provider value={'X'}>
          <Ctx.Consumer>{Echo}</Ctx.Consumer>
        </Ctx.Provider>
        <div tabIndex={1} key={1}>
          Hello
          <React.Fragment>Wener</React.Fragment>
        </div>
      </C>
    );
    let ra: ReactTestRenderer;
    act(() => {
      ra = create(a);
    });

    const data = serialize(a, so);
    t.snapshot(data, 'serialize');

    const out = deserialize(JSON.parse(JSON.stringify(data)), {
      refs: new Map(Array.from(so.refs.entries()).map(([k, v]) => [v, k])),
    });
    t.deepEqual(out, a);

    let rb: ReactTestRenderer;
    act(() => {
      rb = create(out as React.ReactElement);
    });
    t.deepEqual(ra!.toJSON(), rb!.toJSON());
    t.snapshot(ra!.toJSON(), 'render');
  }
  t.pass();
});

const Ctx = React.createContext('default');

const C: React.FC<any> = ({ children, title }) => {
  return (
    <div>
      <div>{title}</div>
      <main>{children}</main>
    </div>
  );
};
C.displayName = 'C';

const MemoComp = React.memo(() => {
  return <div>memo</div>;
});
MemoComp.displayName = 'M';

const Echo = (v: string) => {
  return <div>{v}</div>;
};
