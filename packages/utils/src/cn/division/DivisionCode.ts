/**
 * Codes for the administrative divisions of the People's Republic of China
 *
 * @see https://zh.wikipedia.org/wiki/GB/T_2260 中华人民共和国行政区划代码
 */
export class DivisionCode {
  static Levels = {
    Province: {
      level: 1,
      code: 'Province',
      length: 2,
    },
    City: {
      level: 2,
      code: 'City',
      length: 4,
    },
    County: {
      level: 3,
      code: 'County',
      length: 6,
    },
    Town: {
      level: 4,
      code: 'Town',
      length: 9,
    },
    Village: {
      level: 5,
      code: 'Village',
      length: 12,
    },
  } as const;

  private static instance: DivisionCode;

  static get() {
    return this.instance || (this.instance = new DivisionCode());
  }

  regex = /^(?<province>\d{2})(?<city>\d{2})?(?<county>\d{2})?(?<town>\d{3})?(?<village>\d{3})?$/;

  provinces: Array<[number, string]> = [
    [11, '北京市'],
    [12, '天津市'],
    [13, '河北省'],
    [14, '山西省'],
    [15, '内蒙古自治区'],
    [21, '辽宁省'],
    [22, '吉林省'],
    [23, '黑龙江省'],
    [31, '上海市'],
    [32, '江苏省'],
    [33, '浙江省'],
    [34, '安徽省'],
    [35, '福建省'],
    [36, '江西省'],
    [37, '山东省'],
    [41, '河南省'],
    [42, '湖北省'],
    [43, '湖南省'],
    [44, '广东省'],
    [45, '广西壮族自治区'],
    [46, '海南省'],
    [50, '重庆市'],
    [51, '四川省'],
    [52, '贵州省'],
    [53, '云南省'],
    [54, '西藏自治区'],
    [61, '陕西省'],
    [62, '甘肃省'],
    [63, '青海省'],
    [64, '宁夏回族自治区'],
    [65, '新疆维吾尔自治区'],
    [71, '台湾省'],
    [81, '香港特别行政区'],
    [82, '澳门特别行政区'],
    // 9 国外
  ];
}

export function binarySearch<T, S = number>(arr: T[], value: S, compare: (a: T, b: S) => number) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const cmp = compare(arr[mid], value);
    if (cmp < 0) {
      low = mid + 1;
    } else if (cmp > 0) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
}

// export function getSimpleProvinceLabel(value: string) {
//   if (!value) {
//     return;
//   }
//   let label = value;
//   if (/[0-9]/.test(label)) {
//     label = label.slice(0, 2);
//     label = options.find((v) => v.value === label)?.label || label;
//   }
//   return label.replace(/省|市|(回族|维吾尔|壮族)?自治区|特别行政区$/, '');
// }
