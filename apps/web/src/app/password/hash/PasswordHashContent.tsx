'use client';

import { Password } from '@wener/common/password';
import { showErrorToast } from '@wener/console/toast';
import { ArrayBuffers } from '@wener/utils';
import { useMutative } from 'use-mutative';

export const PasswordHashContent = () => {
  const [state, update] = useMutative(() => {
    let hash = location?.hash?.slice(1) || '';
    if (hash) {
      parsePassword(hash).then((result) => {
        if (result) {
          update((s) => {
            s.parsed = result;
          });
        }
      });
    }
    return {
      hash: hash,
    } as {
      hash: string;
      parsed?: DetectResult;
      verify?: boolean;
    };
  });
  return (
    <div className={'flex flex-col gap-2'}>
      <label className='input input-bordered flex items-center gap-2'>
        Hash
        <input
          type='text'
          className='grow'
          placeholder='...'
          value={state.hash}
          onChange={(e) => update({ hash: e.target.value })}
        />
      </label>
      <div>
        <button
          type={'button'}
          className={'btn btn-primary'}
          disabled={!state.hash}
          onClick={async () => {
            if (state.hash) {
              location.hash = state.hash;
            }
            const parsed = await parsePassword(state.hash);
            update((s) => {
              s.parsed = parsed;
              s.verify = undefined;
            });
          }}
        >
          解析
        </button>
      </div>
      <hr />
      {state.parsed && renderResult(state.parsed)}
    </div>
  );
};

function renderResult(result: DetectResult) {
  let parsed = result.parsed;

  function renderPhc() {
    if (!parsed) return null;

    const { id, version, salt, hash, params = {} } = parsed;

    function renderBinary(a: Uint8Array) {
      let text: string | undefined;

      if ('isWellFormed' in String.prototype) {
        try {
          text = new TextDecoder('utf8', { fatal: true }).decode(a);
          if (!text.isWellFormed()) {
            text = undefined;
          }
        } catch (e) {}
      }

      return (
        <table className={'table compact table-xs'}>
          <colgroup>
            <col className='w-10' />
            <col />
          </colgroup>
          <tbody>
            {text && (
              <tr>
                <td>UTF8</td>
                <td>{text}</td>
              </tr>
            )}
            <tr>
              <td>Hex</td>
              <td>{ArrayBuffers.toString(a, 'hex')}</td>
            </tr>
            <tr>
              <td>Base64</td>
              <td>{ArrayBuffers.toString(a, 'base64')}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    const cols = [
      {
        title: 'ID',
        value: id,
      },
      {
        title: 'Version',
        value: version,
      },
      {
        title: 'Salt',
        value: salt && renderBinary(salt),
      },
      {
        title: 'Hash',
        value: hash && renderBinary(hash),
      },
    ];

    Object.entries(params || {}).forEach(([k, v]) => {
      cols.push({
        title: String(k),
        value: String(v),
      });
    });

    return (
      <>
        {cols
          .filter((v) => v.value !== undefined && (v as any).value !== false)
          .map(({ title, value }, idx) => (
            <tr key={idx}>
              <td>{title}</td>
              <td>{value}</td>
            </tr>
          ))}
      </>
    );
  }

  return (
    <table className={'table'}>
      <colgroup>
        <col className='w-20' />
        <col />
      </colgroup>
      <tbody>
        <tr>
          <td>算法</td>
          <td>{result.algorithm}</td>
        </tr>
        <tr>
          <td>格式</td>
          <td>{result.format}</td>
        </tr>
        {renderPhc()}
      </tbody>
    </table>
  );
}

type DetectResult = {
  format?: 'phc' | 'plain';
  algorithm: string;
  hash: string;
  parsed?: Password.ParsedPassword;
};
const PasswordIds: Record<string, string> = {
  1: 'md5',
  '2a': 'bcrypt', // original
  '2b': 'bcrypt', // February 2014
  '2x': 'bcrypt', // June 2011
  '2y': 'bcrypt', // June 2011
  5: 'sha256',
  6: 'sha512',
  7: 'scrypt',
};

async function parsePassword(hash: string): Promise<DetectResult | undefined> {
  if (isMd5(hash)) {
    return {
      hash,
      format: 'plain',
      algorithm: 'md5',
    };
  }
  if (isSha256(hash)) {
    return {
      hash,
      format: 'plain',
      algorithm: 'sha256',
    };
  }

  if (hash.startsWith('$')) {
    try {
      const out = await Password.parse(hash);
      return {
        hash,
        format: 'phc',
        algorithm: PasswordIds[out.id] || out.id,
        parsed: out,
      };
    } catch (e) {
      showErrorToast('Invalid PHC format');
    }
  }
}

function isMd5(str: string) {
  return /^[a-f0-9]{32}$/.test(str);
}

function isSha256(str: string) {
  return /^[a-f0-9]{64}$/.test(str);
}
