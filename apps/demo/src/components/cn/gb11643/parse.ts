import dayjs from 'dayjs';
import { mod11 } from './mod11';

export class ChinaCitizenId {
  constructor(public division: string, public date: Date, public sequence: number, public sum: string) {}

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
      id = new ChinaCitizenId(this.division, dayjs(this.date).add(1, 'day').toDate(), 1, this.sum);
    } else {
      id = new ChinaCitizenId(this.division, this.date, this.sequence + 1, this.sum);
    }
    id.sum = mod11(id.primary);
    return id;
  }

  prev(): ChinaCitizenId {
    let id;
    if (this.sequence === 0) {
      id = new ChinaCitizenId(this.division, dayjs(this.date).subtract(1, 'day').toDate(), 999, this.sum);
    } else {
      id = new ChinaCitizenId(this.division, this.date, this.sequence - 1, this.sum);
    }
    id.sum = mod11(id.primary);
    return id;
  }

  private get primary() {
    return [
      this.division,
      this.date.getFullYear(),
      this.date.getMonth().toString().padStart(2, '0'),
      this.date.getDate().toString().padStart(2, '0'),
      this.sequence.toString().padStart(3, '0'),
    ].join('');
  }

  static parse(s: string) {
    if (!ChinaCitizenId.Regex.test(s)) {
      throw new Error('Invalid format');
    }
    return new ChinaCitizenId(
      s.slice(0, 6),
      new Date(parseInt(s.slice(6, 10)), parseInt(s.slice(10, 12)) - 1, parseInt(s.slice(12, 14))),
      parseInt(s.slice(14, 17)),
      s.slice(17, 18),
    );
  }

  static random() {
    const id = new ChinaCitizenId(
      Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0'),
      new Date(Math.floor(Math.random() * 100) + 1920, Math.floor(Math.random() * 12), Math.floor(Math.random() * 30)),
      Math.floor(Math.random() * 1000),
      '0',
    );
    id.sum = mod11(id.primary);
    return id;
  }

  static Length = 18;
  static Regex = /^\\d{6}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$/;
}
