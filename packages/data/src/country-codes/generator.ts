import { type CountryCode } from './index';
import { trim } from './trim';

export function convertRecordToCountryCode(record: Record<string, any>): CountryCode {
  const { 'ISO3166-1-Alpha-3': alpha3, 'ISO3166-1-Alpha-2': alpha2, TLD: tld, Languages: languages } = record;
  const cc: CountryCode = {
    alpha2,
    alpha3,
    fullName: {},
    shortName: {},
    officialName: {},

    tld,
    languages: languages.split(','),
  };

  {
    const {
      'UNTERM Arabic Formal': ar,
      'UNTERM Chinese Formal': zh_CN,
      'UNTERM English Formal': en,
      'UNTERM French Formal': fr,
      'UNTERM Russian Formal': ru,
      'UNTERM Spanish Formal': es,
    } = record;
    cc.fullName = {
      ar,
      en,
      es,
      fr,
      ru,
      'zh-CN': zh_CN,
    };
  }
  {
    const {
      'UNTERM Arabic Short': ar,
      'UNTERM Chinese Short': zh_CN,
      'UNTERM English Short': en,
      'UNTERM French Short': fr,
      'UNTERM Russian Short': ru,
      'UNTERM Spanish Short': es,
    } = record;
    cc.shortName = {
      ar,
      en,
      es,
      fr,
      ru,
      'zh-CN': zh_CN,
    };
  }
  {
    const {
      official_name_ar: ar,
      official_name_cn: zh_CN,
      official_name_en: en,
      official_name_fr: fr,
      official_name_ru: ru,
      official_name_es: es,
    } = record;
    cc.officialName = {
      ar,
      en,
      es,
      fr,
      ru,
      'zh-CN': zh_CN,
    };
  }

  {
    let {
      'ISO4217-currency_alphabetic_code': code,
      'ISO4217-currency_name': name,
      'ISO4217-currency_minor_unit': minorUnit,
    } = record;
    if (name === 'No universal currency') {
      name = '';
    }
    cc.currency = {
      code,
      name,
      decimals: parseInt(minorUnit) || undefined,
    };
  }

  return trim(cc);
}
