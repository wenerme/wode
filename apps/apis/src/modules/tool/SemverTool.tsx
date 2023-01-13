import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from 'common/src/daisy';
import * as semver from 'semver';
import { SemVer } from 'semver';
import { SearchBox } from '../../components/common/SearchBox';

export const SemverTool = () => {
  const [params, setParams] = useSearchParams();

  const version = params.get('version') || '';
  const raw = version || '1.0.0';
  const ver = semver.parse(raw);
  const clean = semver.clean(raw);
  const coerce = semver.coerce(raw)?.format();

  const setVersion = (v: string) => {
    setParams({ version: v });
  };
  return (
    <div className={'p-2'}>
      <div className={'flex'}>
        <SearchBox value={version} onChange={setVersion} placeholder={'1.0.0'} />

        <div className={'btn-group px-2'}>
          <Button
            size={'sm'}
            type={'button'}
            className={'normal-case'}
            disabled={raw === clean || !clean}
            onClick={() => {
              clean && setVersion(clean);
            }}
          >
            Clean:
            <small>{clean}</small>
          </Button>
          <Button
            size={'sm'}
            type={'button'}
            className={'normal-case'}
            disabled={raw === coerce || !coerce}
            onClick={() => {
              coerce && setVersion(coerce);
            }}
          >
            Coerce:
            <small>{coerce}</small>
          </Button>
        </div>
      </div>
      <div className={'p-2'}>
        {!ver && (
          <div className="alert alert-warning shadow-lg">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>Version invalid</span>
            </div>
          </div>
        )}

        {ver && <VersionInfo version={ver} />}
      </div>
    </div>
  );
};

const VersionInfo: React.FC<{ version: SemVer; onChange?: (v: string) => void }> = ({ version }) => {
  const { raw, major, minor, patch, prerelease, build } = version;

  const [{ satisfies }, setState] = useState({ satisfies: '', range: '' });

  const items = [
    {
      label: 'Major',
      value: major,
    },
    {
      label: 'Minor',
      value: minor,
    },
    {
      label: 'Patch',
      value: patch,
    },
    {
      label: 'Pre-Release',
      value: prerelease,
    },
    {
      label: 'Build',
      value: build,
    },
  ];
  // export type ReleaseType = 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease';
  const nextItems = [
    {
      label: 'Major',
      value: new SemVer(raw).inc('major').format(),
    },
    {
      label: 'Pre-Major',
      value: new SemVer(raw).inc('premajor').format(),
    },
    {
      label: 'Minor',
      value: new SemVer(raw).inc('minor').format(),
    },
    {
      label: 'Pre-Minor',
      value: new SemVer(raw).inc('preminor').format(),
    },
    {
      label: 'Patch',
      value: new SemVer(raw).inc('patch').format(),
    },
    {
      label: 'Pre-Patch',
      value: new SemVer(raw).inc('prepatch').format(),
    },
    {
      label: 'Pre-Release',
      value: new SemVer(raw).inc('prerelease').format(),
    },
  ];
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{raw}</h2>
        <div className={'flex flex-col gap-2'}>
          <div className={'flex gap-2'}>
            {items.map(({ value, label }) => {
              return (
                <div key={label}>
                  {value && <small className={'opacity-75'}>{label}:</small>}
                  <span className={'font-lg'}>{value}</span>
                </div>
              );
            })}
          </div>
          <div>
            <h3>Next version</h3>
            <div className={'flex flex-col gap-0.5'}>
              {nextItems.map(({ value, label }) => {
                return (
                  <div key={label}>
                    {value && <small className={'opacity-75'}>{label}:</small>}
                    <span className={'font-lg'}>{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <hr />
          <div className={'flex flex-col gap-2'}>
            <div className="form-control">
              <label className="input-group">
                <span>Satisfies</span>
                <input
                  type="text"
                  className={'input input-bordered input-sm'}
                  value={satisfies}
                  onChange={(e) => {
                    setState((s) => ({ ...s, satisfies: e.target.value }));
                  }}
                />
                {satisfies && <span>{semver.satisfies(version, satisfies, true) ? '✅' : '❌'}</span>}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemverTool;
