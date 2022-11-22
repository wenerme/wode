import { randomPick } from '../utils/randomPick';
import { mod31, Mod31Chars } from './mod31';
import { ParsedUSCI, USICRegistryBureauCode } from './usic';

export function randomUsci(info: Partial<ParsedUSCI> = {}): ParsedUSCI {
  info.registryBureauCode ||= randomPick(Object.keys(USICRegistryBureauCode));
  let primaryCode = USICRegistryBureauCode[info.registryBureauCode];
  if (!primaryCode?.codes) {
    throw new Error('invalid registryBureauCode');
  }
  info.registryBureauTypeCode ||= randomPick(Object.keys(primaryCode?.codes!));

  info.registryBureauLabel = primaryCode.label;
  info.registryBureauTypeLabel = primaryCode.codes?.[info.registryBureauTypeCode]?.label;

  info.registryBureauDistrictCode ||= (Math.floor(Math.random() * 899999) + 100000).toString();
  info.subjectCode ||= new Array(9)
    .fill(0)
    .map(() => Mod31Chars[Math.floor(Math.random() * 31)])
    .join('');
  let s =
    String(info.registryBureauCode) +
    String(info.registryBureauTypeCode) +
    String(info.registryBureauDistrictCode) +
    String(info.subjectCode);
  info.checkCode = Mod31Chars[mod31(s)];
  info.raw = s + info.checkCode;
  return info as ParsedUSCI;
}
