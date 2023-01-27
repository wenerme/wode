import { requireFound } from 'common/src/trpc/handlers';
import { z } from 'zod';
import { CountryCode } from '@wener/data/src/country-codes';
import { get, set } from '@wener/utils';
import { publicProcedure, router } from '../../trpc';
import { cnRouter } from './cnRouter';

export const dataRouter = router({
  cn: cnRouter,
  whatis: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/data/whatis/{data}' } })
    .input(
      z.object({
        data: z.string(),
      }),
    )
    .output(z.object({}).passthrough())
    .query(() => {}),
  getCountryCode: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/dara/country-code/{code}' } })
    .input(
      z.object({
        code: z.string(),
        lang: z.string().optional(),
      }),
    )
    .output(z.object({}).passthrough())
    .query(async ({ input: { code, lang = 'zh-CN' }, ctx: {} }) => {
      const found = (await getCountryCodesIndex())[code.toUpperCase()];
      requireFound(found);
      return localize(found, lang, ['fullName', 'shortName', 'officialName', 'currency.name']);
    }),
});

let CountryCodes;
let CountryCodesByKey: Record<string, CountryCode> = {};

async function getCountryCodesIndex(): Promise<Record<string, CountryCode>> {
  await getCountryCodes();
  return CountryCodesByKey;
}

async function getCountryCodes(): Promise<CountryCode[]> {
  return (CountryCodes ||= await (async () => {
    const { default: codes } = await import('@wener/data/country-codes.json');
    const keys = ['alpha2', 'alpha3', 'tld', 'currency.code'];
    codes.forEach((v) => {
      keys.forEach((k) => {
        const idx = get(v, k);
        if (idx && typeof idx === 'string') {
          CountryCodesByKey[idx] = v as CountryCode;
        }
      });
    });
    return codes;
  })());
}

function localize(o: any, lang: string, paths: string[]) {
  o = structuredClone(o);
  for (let path of paths) {
    let dict = get(o, path);
    if (dict) {
      set(o, path, local(dict, lang));
    }
  }
  return o;
}

function local(dict: string | Record<string, string>, lang: string) {
  if (typeof dict === 'object') {
    return dict[lang] ?? dict[lang.split(/_-/)[0]];
  }
  return dict;
}
