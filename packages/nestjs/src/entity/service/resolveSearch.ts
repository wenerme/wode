import { isULID, isUUID } from '@wener/utils';
import { isUSCC } from '@wener/utils/cn';

export interface ResolveSearchOptions<C = any> {
  onTypedKey?: (s: string, ctx: C) => void;
  onULID?: (s: string, ctx: C) => void;
  onUUID?: (s: string, ctx: C) => void;
  onUSCC?: (s: string, ctx: C) => void;
  onKeyLike?: (s: string, ctx: C) => void;
  onMobilePhone?: (s: string, ctx: C) => void;
  onSearch?: (s: string, ctx: C) => void;
  isKeyLike?: (s: string) => boolean;
  isMobilePhone?: (s: string) => boolean;
  isMd5?: (s: string) => boolean;
  onMd5?: (s: string, ctx: C) => void;
  isSha256?: (s: string) => boolean;
  onSha256?: (s: string, ctx: C) => void;
}

export function resolveSearch<C = Record<string, any>>(
  s: string | undefined | null,
  o: ResolveSearchOptions<C> & { context?: C },
) {
  s = String(s || '').trim();
  if (!s) {
    return;
  }
  const {
    isMobilePhone,
    isKeyLike,
    isMd5 = (s: string) => s.length === 32 && /^[0-9a-f]+$/.test(s),
    isSha256 = (s: string) => s.length === 64 && /^[0-9a-f]+$/.test(s),
  } = { isKeyLike: _isMobilePhone, isMobilePhone: _isMobilePhone, ...o };
  const ctx = (o.context || {}) as C;
  if (o.onTypedKey) {
    const sp = s.split('_');
    const [type, rest] = sp;
    if (sp.length == 2 && type && isULID(rest)) {
      o.onTypedKey(s, ctx);
      return;
    }
  }
  if (o.onUUID && isUUID(s)) {
    o.onUUID(s, ctx);
    return;
  }
  if (o.onULID && isULID(s)) {
    o.onULID(s, ctx);
    return;
  }
  if (o.onUSCC && isUSCC(s)) {
    o.onUSCC(s, ctx);
    return;
  }
  if (o.onKeyLike && isKeyLike(s)) {
    o.onKeyLike(s, ctx);
  }
  if (o.onMobilePhone && isMobilePhone(s)) {
    o.onMobilePhone(s, ctx);
  }
  if (o.onMd5 && isMd5(s)) {
    o.onMd5(s, ctx);
  }
  if (o.onSha256 && isSha256(s)) {
    o.onSha256(s, ctx);
  }
  o.onSearch?.(s, ctx);
}

function _isMobilePhone(s: string) {
  // https://github.com/validatorjs/validator.js
  // https://github.com/typestack/class-validator/blob/391f935d9b3d0bebc1588851671b864ee7afd7d8/src/decorator/string/IsMobilePhone.ts#L20
  return /^((\+|00)86)?(1[3-9]|9[28])\d{9}$/.test(s);
}

function _isKeyLike(s: string) {
  return /^[0-9a-zA-Z]+$/.test(s);
}
