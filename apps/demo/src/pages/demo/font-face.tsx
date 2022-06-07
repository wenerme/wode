import type { NextPage } from 'next';
import React, { useEffect, useReducer, useState } from 'react';
import styled from 'styled-components';
import { useImmer } from 'use-immer';

const fontFace = [
  { name: 'AlibabaPuHuiTi_2', title: '阿里巴巴普惠体 2.0' },
  // { name: 'AlibabaPuHuiTi_2_115_Black', title: '阿里巴巴普惠体 2.0 Black' },
  { name: 'Alibaba PuHuiTi', title: '阿里巴巴普惠体 1.0' },
  { name: 'Helvetica Neue' },
  { name: '微软雅黑' },
  { name: 'Helvetica' },
  { name: 'Verdana' },
  { name: 'monospace' },
  { name: 'Courier New' },
  { name: 'Ubuntu' },
  { name: 'Roboto' },
];

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

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const Demo = () => {
  const [state, update] = useImmer<{
    items: Array<{
      name: string;
      title: string;
      available: boolean;
      weights: Array<{ weight: number; available: boolean }>;
    }>;
  }>({ items: [] });
  const [counter, forceRender] = useReducer((s) => s + 1, 0);
  const [text, setText] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    document.fonts.ready.then(() => {
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!ready) {
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
            available: document.fonts.check(`16px ${name}`, text || title || name),
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
    <div className={'container mx-auto'}>
      <Container className={'flex mx-auto justify-center flex flex-col'}>
        <div className={'prose'}>
          <h3>Web字体检测</h3>
        </div>
        <div className={'p-2'}>
          <button disabled={!ready} type={'button'} className={'btn btn-primary btn-sm'} onClick={forceRender}>
            重新检测
          </button>
        </div>
        <table className={'table w-full'}>
          <thead>
            <tr>
              <th>名字</th>
              <th>FontFace</th>
              <th></th>
              <th>Weights</th>
            </tr>
          </thead>
          <tbody>
            {state.items.map(({ name, title, available, weights }, i) => (
              <tr key={i}>
                <td style={{ fontFamily: name }}>{title}</td>
                <td>{name}</td>
                <td>{available ? '✅' : '❌'}</td>
                <td>
                  <div className={'flex flex-col'}>
                    {available &&
                      weights.map(({ weight, available }) => (
                        <span key={weight} style={{ fontFamily: name, fontWeight: weight }}>
                          {title} {weight}
                        </span>
                      ))}
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
