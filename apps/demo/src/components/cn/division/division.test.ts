import test from 'ava';
import { parseDivisionCode } from './parseDivisionCode';

test('division', (t) => {
  t.deepEqual(parseDivisionCode('441422'), {
    cityCode: '4414',
    cityName: '梅州市',
    code: '441422',
    name: '大埔县',
    provinceCode: '44',
    provinceName: '广东省',
  });
});
