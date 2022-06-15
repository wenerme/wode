import type { NextPage } from 'next';
import React, { useMemo } from 'react';
import { useImmer } from 'use-immer';
import Ajv2020 from 'ajv/dist/2020';
import AjvDraft07, { ErrorObject } from 'ajv';
import addKeywords from 'ajv-keywords';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { useForm } from 'react-hook-form';
import YAML from 'yaml';
import JSON5 from 'json5';
import { HiOutlineXCircle } from 'react-icons/hi';
import classNames from 'classnames';

interface Codec {
  parse(s: string): any;

  stringify(s: any, o?: { pretty?: boolean }): string;
}

const Codecs: Record<string, Codec> = {
  yaml: {
    parse: (v) => YAML.parse(v),
    stringify: (v, { pretty = false } = {}) => (pretty ? YAML.stringify(v, null, 2) : YAML.stringify(v)),
  },
  json5: {
    parse: (v) => JSON5.parse(v),
    stringify: (v, { pretty = false } = {}) => (pretty ? JSON5.stringify(v, null, 2) : JSON5.stringify(v)),
  },
  json: {
    parse: (v) => JSON.parse(v),
    stringify: (v, { pretty = false } = {}) => (pretty ? JSON.stringify(v, null, 2) : JSON.stringify(v)),
  },
};

const Demo = () => {
  const [settings, updateSettings] = useImmer<{
    spec: '2020-12' | 'draft-07';
    keywords: boolean;
    formats: boolean;
    errors: boolean;
  }>({
    spec: 'draft-07',
    keywords: true,
    formats: true,
    errors: true,
  });
  const ajv = useMemo(() => {
    let v;
    switch (settings.spec) {
      case 'draft-07':
        v = new AjvDraft07({ allErrors: true });
        break;
      default:
      case '2020-12':
        v = new Ajv2020({ allErrors: true });
    }
    if (settings.formats) {
      v = addFormats(v);
    }
    if (settings.keywords) {
      v = addKeywords(v);
    }
    if (settings.errors) {
      v = addErrors(v);
    }
    return v;
  }, [settings.spec, settings.keywords, settings.formats, settings.errors]);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      schema: `{
  "type": "object",
  "properties": {
    "name": {"type": "string","required": true}
  }
}`,
      data: `{"name":"Wener"}`,
    },
  });
  const [result, updateResult] = useImmer<{ valid?: boolean; error?: any; errors?: ErrorObject[] }>({ errors: [] });
  const doValidate = ({ schema, data }: { schema: string; data: string }) => {
    let s: any;
    let d: any;
    const codec = Codecs.json5;
    try {
      s = codec.parse(schema);
    } catch (e: any) {
      updateResult({ error: new Error('Invalid schema', { cause: e }) });
    }
    try {
      d = codec.parse(data);
    } catch (e: any) {
      updateResult({ error: new Error('Invalid data', { cause: e }) });
      return;
    }
    try {
      console.log(`Input`, s, d);
      const valid = ajv.validate(s, d);
      console.log(`result`, ajv.errors);
      updateResult({ error: undefined, valid, errors: ajv.errors || [] });
    } catch (e: any) {
      updateResult({ error: e });
      return;
    }
  };
  console.log(`Result`, result);
  return (
    <>
      <form className={'grid grid-cols-2 gap-2 p-2 h-full'} onSubmit={handleSubmit(doValidate)}>
        <div className={'flex flex-col gap-2'}>
          <div>
            {result.error?.message && (
              <div className="alert alert-error shadow-sm">
                <div>
                  <HiOutlineXCircle />
                  <span>{result.error?.message}</span>
                </div>
              </div>
            )}
            {!!result.errors?.length &&
              result.errors.map((v, i) => (
                <div key={i} className="alert alert-error shadow-sm">
                  <div>
                    <HiOutlineXCircle />
                    <span className={'flex flex-wrap items-center gap-2'}>
                      <span className={'text-xs'}>
                        {v.keyword}@{v.instancePath || '/'}
                      </span>
                      <span>{v.message}</span>
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <textarea className="textarea textarea-bordered w-full" {...register('schema')} placeholder="{}" />
        </div>
        <div className={'flex flex-col gap-2'}>
          <div>
            <button className={'btn btn-sm btn-primary'}>Validate</button>
          </div>
          <textarea
            className={classNames(
              'w-full textarea textarea-bordered',
              result.valid && 'textarea-success',
              result.valid === false && 'textarea-error',
            )}
            {...register('data')}
            placeholder="{}"
          />
        </div>
      </form>
    </>
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
