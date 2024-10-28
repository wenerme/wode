import { ArrayBuffers } from '@wener/utils';

export namespace PHC {
  // https://github.com/simonepri/phc-format/blob/master/index.js

  const idRegex = /^[a-z0-9-]{1,32}$/;
  const nameRegex = /^[a-z0-9-]{1,32}$/;
  const valueRegex = /^[a-zA-Z0-9/+.-]+$/;
  const b64Regex = /^([a-zA-Z0-9/+.-]+|)$/;
  const decimalRegex = /^((-)?[1-9]\d*|0)$/;
  const versionRegex = /^v=(\d+)$/;

  const fromBase64 = ArrayBuffers.fromBase64;
  const toBase64 = ArrayBuffers.toBase64;
  const isBuffer = (v: any): v is Uint8Array => {
    return v instanceof Uint8Array;
  };

  function objToKeyVal(obj: Record<string, any>): string {
    return objectKeys(obj)
      .map((k) => [k, obj[k]].join('='))
      .join(',');
  }

  function keyValtoObj(str: string): Record<string, string> {
    const obj: Record<string, string> = {};
    str.split(',').forEach((ps) => {
      const pss = ps.split('=');
      if (pss.length < 2) {
        throw new TypeError(`params must be in the format name=value`);
      }

      const key = pss.shift();
      if (key !== undefined) {
        obj[key] = pss.join('=');
      }
    });
    return obj;
  }

  function objectKeys<T extends object>(object: T): Array<keyof T> {
    return Object.keys(object) as Array<keyof T>;
  }

  function objectValues<T extends object>(object: T): Array<T[keyof T]> {
    if (typeof Object.values === 'function') return Object.values(object);
    return objectKeys(object).map((k) => object[k]);
  }

  interface SerializeOptions {
    id: string;
    version?: number;
    params?: Record<string, string | number | Uint8Array>;
    salt?: Uint8Array;
    hash?: Uint8Array;
  }

  /**
   * Generates a PHC string using the data provided.
   * @param  {SerializeOptions} opts Object that holds the data needed to generate the PHC string.
   * @return {string} The hash string adhering to the PHC format.
   */
  export function serialize(opts: SerializeOptions): string {
    const fields: string[] = [''];

    if (typeof opts !== 'object' || opts === null) {
      throw new TypeError('opts must be an object');
    }

    // Identifier Validation
    if (typeof opts.id !== 'string') {
      throw new TypeError('id must be a string');
    }

    if (!idRegex.test(opts.id)) {
      throw new TypeError(`id must satisfy ${idRegex}`);
    }

    fields.push(opts.id);

    if (typeof opts.version !== 'undefined') {
      if (typeof opts.version !== 'number' || opts.version < 0 || !Number.isInteger(opts.version)) {
        throw new TypeError('version must be a positive integer number');
      }

      fields.push(`v=${opts.version}`);
    }

    // Parameters Validation
    if (typeof opts.params !== 'undefined') {
      if (typeof opts.params !== 'object' || opts.params === null) {
        throw new TypeError('params must be an object');
      }

      const pk = objectKeys(opts.params);
      if (!pk.every((p) => nameRegex.test(p.toString()))) {
        throw new TypeError(`params names must satisfy ${nameRegex}`);
      }

      // Convert Numbers into Numeric Strings and Buffers into B64 encoded strings.
      pk.forEach((k) => {
        const value = opts.params![k];
        if (typeof value === 'number') {
          opts.params![k] = value.toString();
        } else if (value instanceof Uint8Array) {
          opts.params![k] = toBase64(value).split('=')[0];
        }
      });
      const pv = objectValues(opts.params);
      if (!pv.every((v) => typeof v === 'string')) {
        throw new TypeError('params values must be strings');
      }

      if (!pv.every((v) => valueRegex.test(v))) {
        throw new TypeError(`params values must satisfy ${valueRegex}`);
      }

      const strpar = objToKeyVal(opts.params as Record<string, string>);
      fields.push(strpar);
    }

    if (typeof opts.salt !== 'undefined') {
      // Salt Validation
      if (!isBuffer(opts.salt)) {
        throw new TypeError('salt must be a Buffer');
      }

      fields.push(toBase64(opts.salt).split('=')[0]);

      if (typeof opts.hash !== 'undefined') {
        // Hash Validation
        if (!isBuffer(opts.hash)) {
          throw new TypeError('hash must be a Buffer');
        }

        fields.push(toBase64(opts.hash).split('=')[0]);
      }
    }

    // Create the PHC formatted string
    const phcstr = fields.join('$');

    return phcstr;
  }

  interface DeserializeResult {
    id: string;
    version?: number;
    params?: Record<string, string | number>;
    salt?: Uint8Array;
    hash?: Uint8Array;
  }

  /**
   * Parses data from a PHC string.
   * @param  {string} phcstr A PHC string to parse.
   * @return {DeserializeResult} The object containing the data parsed from the PHC string.
   */
  export function deserialize(phcstr: string): DeserializeResult {
    if (typeof phcstr !== 'string' || phcstr === '') {
      throw new TypeError('pchstr must be a non-empty string');
    }

    if (phcstr[0] !== '$') {
      throw new TypeError('pchstr must contain a $ as first char');
    }

    const fields = phcstr.split('$');
    // Remove first empty $
    fields.shift();

    // Parse Fields
    let maxf = 5;
    if (!versionRegex.test(fields[1])) maxf--;
    if (fields.length > maxf) {
      throw new TypeError(`pchstr contains too many fileds: ${fields.length}/${maxf}`);
    }

    // Parse Identifier
    const id = fields.shift();
    if (!id || !idRegex.test(id)) {
      throw new TypeError(`id must satisfy ${idRegex}`);
    }

    let version: number | undefined;
    // Parse Version
    if (fields[0] && versionRegex.test(fields[0])) {
      const versionMatch = fields.shift()?.match(versionRegex);
      version = versionMatch ? parseInt(versionMatch[1], 10) : undefined;
    }

    let hash: Uint8Array | undefined;
    let salt: Uint8Array | undefined;
    if (fields[fields.length - 1] && b64Regex.test(fields[fields.length - 1])) {
      if (fields.length > 1 && b64Regex.test(fields[fields.length - 2])) {
        // Parse Hash
        const hashStr = fields.pop();
        if (hashStr) hash = fromBase64(hashStr);
        // Parse Salt
        const saltStr = fields.pop();
        if (saltStr !== undefined) salt = fromBase64(saltStr);
      } else {
        // Parse Salt
        const saltStr = fields.pop();
        if (saltStr !== undefined) salt = fromBase64(saltStr);
      }
    }

    // Parse Parameters
    let params: Record<string, string | number> | undefined;
    if (fields.length > 0) {
      const parstr = fields.pop();
      if (parstr) {
        params = keyValtoObj(parstr);
        if (!Object.keys(params).every((p) => nameRegex.test(p))) {
          throw new TypeError(`params names must satisfy ${nameRegex}}`);
        }

        const pv = Object.values(params);
        if (!pv.every((v) => valueRegex.test(String(v)))) {
          throw new TypeError(`params values must satisfy ${valueRegex}`);
        }

        // Convert Decimal Strings into Numbers
        Object.keys(params).forEach((k) => {
          const value = params![k];
          if (typeof value === 'string' && decimalRegex.test(value)) {
            params![k] = parseInt(value, 10);
          }
        });
      }
    }

    if (fields.length > 0) {
      throw new TypeError(`pchstr contains unrecognized fileds: ${fields}`);
    }

    // Build the output object
    const phcobj: DeserializeResult = { id };
    if (version !== undefined) phcobj.version = version;
    if (params) phcobj.params = params;
    if (salt) phcobj.salt = salt;
    if (hash) phcobj.hash = hash;

    return phcobj;
  }
}
