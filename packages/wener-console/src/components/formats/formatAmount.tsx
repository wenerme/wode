import { isDefined } from '@wener/utils';

export function formatAmount(
  v?: number | string,
  {
    currency,
    fallback = '-',
  }: {
    currency?: string;
    fallback?: string;
  } = {},
) {
  if (!isDefined(v)) {
    return fallback;
  }
  if (typeof v === 'string') {
    v = Number.parseFloat(v);
  }
  if (Number.isNaN(v)) {
    return fallback;
  }
  if (currency) {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(v);
  }
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}
