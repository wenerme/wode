export class UUID {
  static random() {
    return new UUID().toString();
  }

  private readonly _time: number;
  private readonly _random: number;
  private readonly _entropy: number;

  constructor() {
    this._time = Date.now();
    this._random = Math.floor(Math.random() * 0x100000000);
    this._entropy = Math.floor(Math.random() * 0x100000000);
  }

  toString() {
    const time = this._time.toString(16).padStart(10, '0');
    const random = this._random.toString(16).padStart(8, '0');
    const entropy = this._entropy.toString(16).padStart(8, '0');
    return time + random + entropy;
  }
}
