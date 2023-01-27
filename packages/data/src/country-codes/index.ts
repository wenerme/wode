export {};

// @ts-ignore
declare module '@wener/data/country-codes.json' {
  const CountryCodes: CountryCode[];
  export default CountryCodes;
}

export interface CountryCode<Lang = MultiLang> {
  // ISO3166 Alpha-3
  alpha3: string;
  // ISO3166 Alpha-2
  alpha2: string;

  fullName?: Lang;
  shortName?: Lang;
  officialName?: Lang;

  // ISO4217
  currency?: {
    code: string;
    name?: Lang;
    decimals?: number;
  };

  tld?: string;
  languages?: string[];
}

type MultiLang = string | Record<string, string>;
