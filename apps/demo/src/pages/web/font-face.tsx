import React, { useDeferredValue, useEffect, useReducer, useState } from 'react';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import type { NextPage } from 'next';
import styled from 'styled-components';
import { useImmer } from 'use-immer';

const fontFace = [
  { name: 'Alibaba PuHuiTi', title: '阿里巴巴普惠体 1.0' },
  { name: 'AlibabaPuHuiTi_2', title: '阿里巴巴普惠体 2.0' },
  { name: 'Arial' },
  { name: 'Courier New' },
  { name: 'Hei', title: '黑体' },
  { name: 'Helvetica Neue' },
  { name: 'Helvetica' },
  { name: 'Hiragino Sans GB', title: '冬青黑体简体中文' },
  { name: 'Hiragino Sans TC', title: '冬青黑体繁体中文' },
  { name: 'Kai', title: '楷体' },
  { name: 'Montserrat' },
  { name: 'Open Sans' },
  { name: 'PingFang SC', title: '苹方 简体' },
  { name: 'Raleway' },
  { name: 'Robot Mono' },
  { name: 'Roboto' },
  { name: 'STFangsong', title: '华文仿宋' },
  { name: 'STHeiti', title: '华文黑体' },
  { name: 'STKaiti', title: '华文楷体' },
  { name: 'STSongti', title: '华文宋体' },
  { name: 'Song', title: '宋体' },
  { name: 'Source Sans Pro' },
  { name: 'Times' },
  { name: 'Ubuntu' },
  { name: 'Verdana' },
  { name: 'Zapf Chancery' },
  { name: 'Zapfino' },
  { name: 'monospace' },
  { name: '微软雅黑' },
];

const fonts: Record<string, Record<string, string>> = {
  AlibabaPuHuiTi_2: {
    100: 'AlibabaPuHuiTi_2_35_Thin',
    400: 'AlibabaPuHuiTi_2_55_Regular',
  },
};

const Container = styled.div`
  @font-face {
    font-family: 'Alibaba PuHuiTi';
    src: local('Alibaba PuHuiTi');
  }
  @font-face {
    font-family: 'Alibaba PuHuiTi';
    src: local('Alibaba PuHuiTi Light');
    font-weight: 300;
  }
  @font-face {
    font-family: 'Alibaba PuHuiTi';
    src: local('Alibaba PuHuiTi Medium');
    font-weight: 500;
  }
  @font-face {
    font-family: 'Alibaba PuHuiTi';
    src: local('Alibaba PuHuiTi Bold');
    font-weight: 700;
  }
  @font-face {
    font-family: 'Alibaba PuHuiTi';
    src: local('Alibaba PuHuiTi Heavy');
    font-weight: 900;
  }

  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_35_Thin);
    font-weight: 100;
  }

  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_45_Light);
    font-weight: 300;
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2), local(AlibabaPuHuiTi_2_55_Regular);
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_65_Medium);
    font-weight: 500;
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_75_SemiBold);
    font-weight: 600;
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_85_Bold);
    font-weight: 700;
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_95_ExtraBold);
    font-weight: 800;
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_105_Heavy);
    font-weight: 900;
  }
  @font-face {
    font-family: AlibabaPuHuiTi_2;
    src: local(AlibabaPuHuiTi_2_115_Black);
    font-weight: 950;
  }
`;

const fontCategories = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'display', label: 'Display' },
  { value: 'script', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
];

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const sizes = [8, 12, 14, 20, 24, 32, 40, 64, 96, 120, 184, 280];
const Demo = () => {
  // trigger font load
  const [state, update] = useImmer<{
    items: Array<{
      name: string;
      title: string;
      available: boolean;
      weights: Array<{ weight: number; available: boolean }>;
    }>;
  }>({ items: fontFace.map(({ name, title }) => ({ name, title: title || name, available: false, weights: [] })) });
  const [counter, forceRender] = useReducer((s) => s + 1, 0);
  const [ready, setReady] = useState({ fontSet: false });
  const [settings, updateSettings] = useImmer<{ weights: number[]; text: string; size: number; previewText: boolean }>({
    weights: [],
    text: '',
    size: 24,
    previewText: true,
  });
  const text = useDeferredValue(settings.text);
  const fontSize = useDeferredValue(settings.size);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setReady((s) => ({ ...s, fontSet: true }));
    });
  }, []);
  useEffect(() => {
    if (!ready.fontSet) {
      return;
    }
    update((s) => {
      s.items = fontFace
        .map(({ name, title }) => {
          return {
            weights: weights.map((v) => {
              return {
                weight: v,
                // weight not works
                available: true,
                // available: document.fonts.check(`${v} 16px ${name}`, text),
              };
            }),
            name,
            title: title || name,
            available: document.fonts.check(`16px ${name}`),
          };
        })
        .sort((a, b) => {
          if (a.available === b.available) {
            return a.name.localeCompare(b.name);
          }
          return a.available ? -1 : 1;
        });
    });
  }, [fontFace, counter, ready]);
  return (
    <div className={'container mx-auto'} style={{ contain: 'content' }}>
      <Container className={'flex mx-auto justify-center flex flex-col'}>
        <div className={'prose'}>
          <h3>Web字体检测</h3>
          <details>
            <summary>检测说明</summary>
            <p>
              接口基于{' '}
              <a
                href='https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet'
                target={'_blank'}
                rel={'noreferrer'}
              >
                FontFaceSet
              </a>
              。
            </p>
            <ul>
              <li>Chrome 35+</li>
              <li>Safari 12+ 禁止访问白名单外字体，检测结果不准确。</li>
            </ul>
          </details>
        </div>
        <div className={'p-2 flex gap-2'}>
          <button disabled={!ready} type={'button'} className={'btn btn-primary btn-sm'} onClick={forceRender}>
            重新检测
          </button>
          <select
            className={'select select-sm select-bordered'}
            value={settings.weights.join(',')}
            onChange={(e) =>
              updateSettings({
                ...settings,
                weights: e.currentTarget.value ? e.currentTarget.value.split(',').map((v) => parseInt(v)) : [],
              })
            }
          >
            <option value=''>Weights</option>
            <option value='300,500,700'>300,500,700</option>
            <option value={weights.join(',')}>所有</option>
            {weights.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <div className='form-control'>
            <div className='input-group input-group-sm'>
              <button
                type={'button'}
                className='btn btn-sm btn-square'
                onClick={() => updateSettings({ ...settings, previewText: !settings.previewText })}
              >
                {settings.previewText && <AiFillEye />}
                {!settings.previewText && <AiFillEyeInvisible />}
              </button>
              <input
                type='text'
                placeholder='Preview text'
                className='input input-sm input-bordered'
                value={settings.text}
                onChange={(e) => updateSettings({ ...settings, text: e.currentTarget.value })}
              />
            </div>
          </div>

          <div className={'flex items-center gap-2'}>
            <div className={'dropdown dropdown-hover'}>
              <label tabIndex={0} className={'btn btn-sm btn-ghost w-12 text-right'}>
                {settings.size}px
              </label>
              <ul
                tabIndex={0}
                className={'dropdown-content menu p-2 shadow bg-base-100 rounded-box w-20 h-[240px] overflow-y-auto'}
              >
                {sizes.map((v) => (
                  <li
                    key={v}
                    onClick={() => updateSettings({ ...settings, size: v })}
                    className={'p-2 hover:bg-gray-100 rounded'}
                  >
                    {v}
                  </li>
                ))}
              </ul>
            </div>
            <input
              type='range'
              min='8'
              max='280'
              value={settings.size}
              onChange={(e) => updateSettings({ ...settings, size: parseInt(e.currentTarget.value) })}
              className='range range-sm w-[200px]'
            />
          </div>
        </div>
        <table className={'table w-full'}>
          <colgroup>
            <col width={120} />
            <col width={120} />
            <col width={20} />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th>名字</th>
              <th>FontFace</th>
              <th>可用?</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {state.items.map(({ name, title, available, weights }, i) => (
              <tr key={i}>
                <td style={{ fontFamily: [name, fonts[name]?.['400']].filter(Boolean).join(',') }}>{title}</td>
                <td>{name}</td>
                <td>{available ? '✅' : '❌'}</td>
                <td>
                  <div className={'flex flex-col'}>
                    {available &&
                      settings.weights.map((weight) => (
                        <span key={weight} style={{ fontFamily: name, fontWeight: weight, fontSize }}>
                          {text || title} {weight}
                        </span>
                      ))}
                    {available && !settings.weights.length && (
                      <span style={{ fontFamily: name, fontSize }}>{text || title}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Container>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Demo />
    </>
  );
};

export default CurrentPage;
