/**
 * @see https://gist.github.com/tonyc726/00c829a54a40cf80409f
 * @see https://github.com/Siykt/javascript-algorithms/blob/master/src/algorithms/string/getChinesePrice.ts 人民币金额转中文大写
 */
export function formatChineseAmount(price: number) {
  if (price === 0) return '零元整';
  if (price >= 1e12) return '整数位已超过最大值';

  const CHINESE_NUMBER_MAP = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const CHINESE_UNIT_MAP = ['', '拾', '佰', '仟'];
  const CHINESE_BIG_UNIT_MAP = ['', '万', '亿'];
  const CHINESE_SMALL_UNIT_MAP = ['角', '分', '厘', '毫'];

  const priceStr = price.toString();
  const priceArr = priceStr.split('.');
  const integer = priceArr[0];
  const decimal = priceArr[1];

  let chineseIntegerPrice = '';
  let zeroCount = 0;

  for (let i = 0; i < integer.length; i++) {
    const num = +integer[i];
    const unit = integer.length - i - 1; // 当前数字的单位
    const quotient = Math.floor(unit / 4); // 1w为进位单位, 除 4 即为 万 亿
    const remainder = unit % 4; // 1w为进位单位, 取模 4 即为 个 十 百 千

    if (num === 0) {
      zeroCount++;
    } else {
      // 处理前置的零
      if (zeroCount > 0) chineseIntegerPrice += CHINESE_NUMBER_MAP[0];
      zeroCount = 0;
      chineseIntegerPrice += CHINESE_NUMBER_MAP[num] + CHINESE_UNIT_MAP[remainder];
    }
    if (remainder === 0 && zeroCount < 4) {
      chineseIntegerPrice += CHINESE_BIG_UNIT_MAP[quotient];
    }
  }

  // 价格为小数时，整数部分不显示
  if (price < 1) chineseIntegerPrice = '';
  else chineseIntegerPrice += '元';

  let chineseDecimalPrice = '';

  if (!decimal) {
    chineseDecimalPrice = '整';
  } else {
    let hasZero = false;
    for (let i = 0; i < decimal.length; i++) {
      const num = +decimal[i];
      if (num) chineseDecimalPrice += CHINESE_NUMBER_MAP[num] + CHINESE_SMALL_UNIT_MAP[i];
      else hasZero = true;
    }

    if (chineseIntegerPrice && hasZero) chineseIntegerPrice += '零';
  }

  return chineseIntegerPrice + chineseDecimalPrice;
}
