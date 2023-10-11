import { randomDivisionCode } from '@wener/data/cn/division';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import { mod11 } from './mod11';

export class ChinaCitizenId {
  constructor(
    public division: string,
    public date: Dayjs,
    public sequence: number,
    public sum: string,
  ) {}

  get valid() {
    return mod11(this.primary) === this.sum;
  }

  toString() {
    return this.primary + this.sum;
  }

  get male() {
    return this.sequence % 2 === 1;
  }

  get female() {
    return this.sequence % 2 === 0;
  }

  get gender(): 'male' | 'female' {
    return this.sequence % 2 === 1 ? 'male' : 'female';
  }

  next(): ChinaCitizenId {
    let id;
    if (this.sequence === 999) {
      id = new ChinaCitizenId(this.division, this.date.add(1, 'day'), 1, this.sum);
    } else {
      id = new ChinaCitizenId(this.division, this.date, this.sequence + 1, this.sum);
    }
    id.sum = mod11(id.primary);
    return id;
  }

  prev(): ChinaCitizenId {
    let id;
    if (this.sequence === 0) {
      id = new ChinaCitizenId(this.division, this.date.subtract(1, 'day'), 999, this.sum);
    } else {
      id = new ChinaCitizenId(this.division, this.date, this.sequence - 1, this.sum);
    }
    id.sum = mod11(id.primary);
    return id;
  }

  get primary() {
    return [this.division, this.date.format('YYYYMMDD'), this.sequence.toString().padStart(3, '0')].join('');
  }

  static parse(s: string) {
    if (!ChinaCitizenId.Pattern.test(s)) {
      throw new Error('Invalid format');
    }
    return new ChinaCitizenId(
      s.slice(0, 6),
      dayjs(s.slice(6, 14), 'YYYYMMDD'),
      // new Date(parseInt(s.slice(6, 10)), parseInt(s.slice(10, 12)) - 1, parseInt(s.slice(12, 14))),
      parseInt(s.slice(14, 17)),
      s.slice(17, 18),
    );
  }

  static random() {
    dayjs.extend(objectSupport);
    const id = new ChinaCitizenId(
      randomDivisionCode(),
      dayjs({
        year: Math.floor(Math.random() * 100) + 1920,
        month: Math.floor(Math.random() * 12),
        day: Math.floor(Math.random() * 30),
      }),
      Math.floor(Math.random() * 1000),
      '0',
    );
    id.sum = mod11(id.primary);
    return id;
  }

  static Length = 18;
  static Pattern = /^\d{6}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/;
}
