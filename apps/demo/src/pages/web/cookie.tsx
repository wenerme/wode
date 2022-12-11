import React from 'react';
import { HiOutlineXCircle } from 'react-icons/hi2';
import cookie from 'cookie';
import type { NextPage } from 'next';
import { useImmer } from 'use-immer';

const Demo = () => {
  const [state, update] = useImmer({
    value: '',
    parsed: `{}`,
    alert: undefined as { level: string; message: string } | undefined,
  });
  return (
    <>
      <div className={'flex mx-auto justify-center max-w-prose flex flex-col gap-2'}>
        <textarea
          className={'textarea textarea-bordered'}
          rows={3}
          value={state.value}
          onChange={(e) => {
            update((draft) => {
              draft.value = e.target.value;
            });
          }}
        />
        <div className={'flex gap-2'}>
          <button
            className={'btn'}
            onClick={() => {
              update((s) => {
                try {
                  s.parsed = JSON.stringify(cookie.parse(s.value), null, 2);
                  s.alert = undefined;
                } catch (e) {
                  s.alert = {
                    level: 'error',
                    message: String(e),
                  };
                }
              });
            }}
          >
            Parse
          </button>
          <button
            className={'btn'}
            onClick={() => {
              update((s) => {
                try {
                  const o = JSON.parse(s.parsed);
                  s.value = Object.entries(o)
                    .map(([k, v]: [string, any]) => {
                      return cookie.serialize(k, typeof v === 'string' ? v : v.value, typeof v === 'object' ? v : {});
                    })
                    .join('; ');
                  s.alert = undefined;
                } catch (e) {
                  s.alert = {
                    level: 'error',
                    message: String(e),
                  };
                }
              });
            }}
          >
            Build
          </button>
        </div>
        <Alert {...state.alert} />
        <textarea
          className={'textarea textarea-bordered'}
          cols={30}
          rows={10}
          value={state.parsed}
          onChange={(e) => {
            update((s) => {
              s.parsed = e.target.value;
            });
          }}
        ></textarea>
      </div>
    </>
  );
};

const Alert: React.FC<{ level?: string; message?: string }> = ({ message, level }) => {
  if (!message) {
    return null;
  }
  return (
    <div
      className={`py-4 alert shadow-lg ${
        { info: 'alert-info', success: 'alert-success', warning: 'alert-warning', error: 'alert-error' }[
          level || 'info'
        ]
      }`}
    >
      <div>
        {level === 'error' && <HiOutlineXCircle className={'w-7 h-7'} />}
        <span>{message}</span>
      </div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <div className={'container mx-auto'}>
        <Demo />
      </div>
    </>
  );
};

export default CurrentPage;
