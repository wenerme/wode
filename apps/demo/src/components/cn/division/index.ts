import { randomDivisionCode as _randomDivisionCode } from '@wener/data/cn';
import { MaybePromise } from '@wener/utils';

let Divisions: Record<string, string>;

export function index(): MaybePromise<Record<string, string>> {
  if (Divisions) {
    return Divisions;
  }
  return import('@wener/data/cn/division/divisions.json').then((v) => (Divisions = v.default));
}

export function randomDivisionCode() {
  let divisions = index();
  if ('then' in divisions) {
    return _randomDivisionCode();
  }
  return _randomDivisionCode(divisions);
}
