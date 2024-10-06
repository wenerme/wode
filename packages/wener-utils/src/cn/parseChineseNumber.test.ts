import { expect, test } from 'vitest';
import { formatChineseAmount } from './formatChineseAmount';
import { parseChineseNumber } from './parseChineseNumber';

test('parseChineseNumber', () => {
  for (const [a, b] of [
    ['0', 0],
    ['10000', 10_000],
    ['123', 123],
    ['一万', 10_000],
    ['一万一', 10_001],
    ['一万一百一', 10_101],
    ['一万零一百零一', 10_101],
    ['一千零一十', 1010],
    ['一千零一十一', 1011],
    ['一捌玖', 189],
    ['一百一', 101],
    ['一百九十二', 192],
    ['捌玖', 89],
    ['捌玖零', 890],
    ['零捌玖', 89],
    ['肆仟叁佰陆拾', 4360],
    // ['陆仟捌佰捌拾捌元肆角贰分', 89],
  ] as const) {
    expect(parseChineseNumber(a)).toBe(b);
    console.log(
      a,
      b,
      formatChineseNumber(b),
      formatChineseAmount0(b) === formatChineseAmount(b),
      formatChineseAmount0(b),
      formatChineseAmount(b),
    );
  }
});

function formatChineseNumber(v: number): string {
  if (v < 0) {
    return '负' + formatChineseNumber(-v);
  }

  // 数字对应的中文表示
  const digits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百', '千'];
  const bigUnits = ['', '万', '亿', '兆'];

  if (v < 10) {
    return digits[v];
  }

  // 将数字分割成千位分隔的数组
  let parts = [];
  while (v > 0) {
    parts.push(v % 10000);
    v = Math.floor(v / 10000);
  }

  // 从最高位开始处理每个部分
  let result = parts
    .map((part, idx) => {
      let str = '';
      let zeroFlag = false; // 标记是否需要添加零

      for (let i = 0; part > 0; i++) {
        let currentDigit = part % 10;
        if (currentDigit !== 0) {
          str = digits[currentDigit] + (i > 0 ? units[i] : '') + str;
          zeroFlag = true; // 若当前位不为零，则后面可能需要加零
        } else if (zeroFlag) {
          str = digits[0] + str; // 加零操作
          zeroFlag = false; // 重置零标志
        }
        part = Math.floor(part / 10);
      }

      // 返回处理后的字符串，加上相应的大单位
      return str + bigUnits[idx];
    })
    .reverse()
    .join('')
    .replace(/〇+/g, '〇')
    .replace(/〇([万亿兆])/g, '$1');

  // 处理连续〇的情况以及〇位于大单位前的情况
  return result;
}

export function formatChineseAmount0(amount: number): string {
  // 检查金额是否合理
  if (amount < 0) {
    return '(负)' + formatChineseAmount0(-amount);
  }
  // 大写数字和单位
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const basicUnits = ['', '拾', '佰', '仟'];
  const bigUnits = ['元', '万', '亿'];

  // 转换为整数处理
  let integerAmount = Math.round(amount * 100); // 转为分为单位

  if (integerAmount === 0) {
    return '零元整';
  }

  let result = '';

  // 处理小数部分（分、角）
  const cents = integerAmount % 100;
  const jiao = Math.floor(cents / 10);
  const fen = cents % 10;
  integerAmount = Math.floor(integerAmount / 100); // 转为元为单位

  if (fen > 0) {
    result = digits[fen] + '分' + result;
  }
  if (jiao > 0) {
    result = digits[jiao] + '角' + result;
  }
  if (cents === 0) {
    result += '整';
  }

  // 处理整数部分
  let unitIndex = 0;
  let zeroCount = 0;
  let needZero = false;

  while (integerAmount > 0) {
    let segment = integerAmount % 10000;
    let segmentString = '';

    for (let i = 0; i < 4 && segment > 0; i++) {
      let digit = segment % 10;
      if (digit === 0) {
        zeroCount++;
      } else {
        if (zeroCount > 0 || needZero) {
          segmentString = digits[0] + segmentString;
          zeroCount = 0;
          needZero = false;
        }
        segmentString = digits[digit] + basicUnits[i] + segmentString;
      }
      segment = Math.floor(segment / 10);
    }

    if (segment > 0 || unitIndex === 0 || segmentString !== '') {
      result = segmentString + bigUnits[unitIndex] + result;
      needZero = true;
    }
    integerAmount = Math.floor(integerAmount / 10000);
    unitIndex++;
  }

  // 去除多余的零，调整单位和数位
  result = result.replace(/零+/g, '零').replace(/零元/, '元').replace(/零万/, '万');

  return result;
}
