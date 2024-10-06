import { ArrayBuffers } from '@wener/utils';
import { describe, expect, it } from 'vitest';
import { PHC } from './PHC';

const { deserialize, serialize } = PHC;

describe('deserialize', () => {
  it('should deserialize correct phc strings', () => {
    sdData.serialized.forEach((serialized: string, i: number) => {
      expect(deserialize(serialized), `Failed to deserialize ${serialized}`).toEqual(sdData.deserialized[i]);
    });
  });

  it('should throw errors if trying to deserialize an invalid phc string', async () => {
    expect(() => deserialize(null as any)).toThrow('pchstr must be a non-empty string');

    expect(() => deserialize('a$invalid')).toThrow('pchstr must contain a $ as first char');

    expect(() => deserialize('$b$c$d$e$f')).toThrow('pchstr contains too many fileds: 5/4');

    expect(() => deserialize('invalid')).toThrow('pchstr must contain a $ as first char');

    expect(() => deserialize('$i_n_v_a_l_i_d')).toThrowError(/id must satisfy/);

    expect(() => deserialize('$pbkdf2$rounds_=1000')).toThrowError(/params names must satisfy/);

    expect(() => deserialize('$pbkdf2$rounds=1000@')).toThrowError(/params values must satisfy/);

    expect(() => deserialize('$pbkdf2$rounds:1000')).toThrowError(/params must be in the format name=value/);

    expect(() => deserialize('$argon2i$unrecognized$m=120,t=5000,p=2$EkCWX6pSTqWruiR0')).toThrowError(
      /pchstr contains unrecognized fileds/,
    );

    expect(() => deserialize('$argon2i$unrecognized$v=19$m=120,t=5000,p=2$EkCWX6pSTqWruiR0')).toThrow(
      'pchstr contains too many fileds: 5/4',
    );

    expect(() => deserialize('$argon2i$v=19$unrecognized$m=120,t=5000,p=2$EkCWX6pSTqWruiR0')).toThrowError(
      /pchstr contains unrecognized fileds/,
    );
  });
});

describe('serialize', () => {
  it('should serialize correct phc objects', () => {
    sdData.deserialized.forEach((_, i) => {
      expect(serialize(sdData.deserialized[i] as any)).toEqual(sdData.serialized[i]);
    });
    sData.deserialized.forEach((_, i) => {
      expect(serialize(sData.deserialized[i])).toEqual(sData.serialized[i]);
    });
  });

  it('should throw errors if trying to serialize with invalid arguments', async () => {
    expect(() => serialize(null as any)).toThrow('opts must be an object');

    expect(() => serialize({} as any)).toThrow('id must be a string');

    expect(() => serialize({ id: 'i_n_v_a_l_i_d' } as any)).toThrowError(/id must satisfy/);

    expect(() => serialize({ id: 'pbkdf2', params: null } as any)).toThrow('params must be an object');

    expect(() =>
      serialize({
        id: 'pbkdf2',
        params: { i: {} },
      } as any),
    ).toThrow('params values must be strings');

    expect(() => serialize({ id: 'pbkdf2', params: { rounds_: '1000' } } as any)).toThrowError(
      /params names must satisfy/,
    );

    expect(() => serialize({ id: 'pbkdf2', params: { rounds: '1000@' } } as any)).toThrowError(
      /params values must satisfy/,
    );

    expect(() => serialize({ id: 'pbkdf2', params: { rounds: '1000' }, salt: 'string' } as any)).toThrow(
      'salt must be a Buffer',
    );

    expect(() =>
      serialize({
        id: 'argon2id',
        version: -10,
      } as any),
    ).toThrow('version must be a positive integer number');

    expect(() =>
      serialize({
        id: 'pbkdf2',
        params: { rounds: '1000' },
        salt: bufferFrom('string'),
        hash: 'string',
      } as any),
    ).toThrow('hash must be a Buffer');
  });
});

const bufferFrom = (a: string, b?: any): Uint8Array => {
  return ArrayBuffers.from(a, b, Uint8Array);
};

const sdData = {
  serialized: [
    '$argon2i$m=120,t=5000,p=2',
    '$argon2i$m=120,t=4294967295,p=2',
    '$argon2i$m=2040,t=5000,p=255',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0ZQ',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0ZQA',
    '$argon2i$m=120,t=5000,p=2,data=sRlHhRmKUGzdOmXn01XmXygd5Kc',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc',

    '$argon2i$m=120,t=5000,p=2$/LtFjH5rVL8',
    '$argon2i$m=120,t=5000,p=2$4fXXG0spB92WPB1NitT8/OH0VKI',
    '$argon2i$m=120,t=5000,p=2$BwUgJHHQaynE+a4nZrYRzOllGSjjxuxNXxyNRUtI6Dlw/zlbt6PzOL8Onfqs6TcG',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0$4fXXG0spB92WPB1NitT8/OH0VKI',
    '$argon2i$m=120,t=5000,p=2,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$4fXXG0spB92WPB1NitT8/OH0VKI',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$4fXXG0spB92WPB1NitT8/OH0VKI',

    '$argon2i$m=120,t=5000,p=2$4fXXG0spB92WPB1NitT8/OH0VKI$iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0$4fXXG0spB92WPB1NitT8/OH0VKI$iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM',
    '$argon2i$m=120,t=5000,p=2,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$4fXXG0spB92WPB1NitT8/OH0VKI$iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$4fXXG0spB92WPB1NitT8/OH0VKI$iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$iHSDPHzUhPzK7rCcJgOFfg$EkCWX6pSTqWruiR0',
    '$argon2i$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$iHSDPHzUhPzK7rCcJgOFfg$J4moa2MM0/6uf3HbY2Tf5Fux8JIBTwIhmhxGRbsY14qhTltQt+Vw3b7tcJNEbk8ium8AQfZeD4tabCnNqfkD1g',
    '$scrypt$ln=1,r=16,p=1$$d9ZXYjhleyA7GcpCwYoEl/FrSETjB0ro39/6P+3iFEL80Aad7QlI+DJqdToPyB8X6NPg+y4NNijPNeIMONGJBg',
    '$argon2i$v=19$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$iHSDPHzUhPzK7rCcJgOFfg$J4moa2MM0/6uf3HbY2Tf5Fux8JIBTwIhmhxGRbsY14qhTltQt+Vw3b7tcJNEbk8ium8AQfZeD4tabCnNqfkD1g',
  ],
  deserialized: [
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2 },
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 4294967295, p: 2 },
    },
    {
      id: 'argon2i',
      params: { m: 2040, t: 5000, p: 255 },
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, keyid: 'Hj5+dsK0' },
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, keyid: 'Hj5+dsK0ZQ' },
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, keyid: 'Hj5+dsK0ZQA' },
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc' },
    },
    {
      id: 'argon2i',
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc',
      },
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2 },
      salt: bufferFrom('/LtFjH5rVL8', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2 },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2 },
      salt: bufferFrom('BwUgJHHQaynE+a4nZrYRzOllGSjjxuxNXxyNRUtI6Dlw/zlbt6PzOL8Onfqs6TcG', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, keyid: 'Hj5+dsK0' },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc' },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
    },
    {
      id: 'argon2i',
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc',
      },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2 },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
      hash: bufferFrom('iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, keyid: 'Hj5+dsK0' },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
      hash: bufferFrom('iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM', 'base64'),
    },
    {
      id: 'argon2i',
      params: { m: 120, t: 5000, p: 2, data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc' },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
      hash: bufferFrom('iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM', 'base64'),
    },
    {
      id: 'argon2i',
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc',
      },
      salt: bufferFrom('4fXXG0spB92WPB1NitT8/OH0VKI', 'base64'),
      hash: bufferFrom('iPBVuORECm5biUsjq33hn9/7BKqy9aPWKhFfK2haEsM', 'base64'),
    },
    {
      id: 'argon2i',
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc',
      },
      salt: bufferFrom('iHSDPHzUhPzK7rCcJgOFfg', 'base64'),
      hash: bufferFrom('EkCWX6pSTqWruiR0', 'base64'),
    },
    {
      id: 'argon2i',
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc',
      },
      salt: bufferFrom('iHSDPHzUhPzK7rCcJgOFfg', 'base64'),
      hash: bufferFrom(
        'J4moa2MM0/6uf3HbY2Tf5Fux8JIBTwIhmhxGRbsY14qhTltQt+Vw3b7tcJNEbk8ium8AQfZeD4tabCnNqfkD1g',
        'base64',
      ),
    },
    {
      id: 'scrypt',
      params: {
        ln: 1,
        r: 16,
        p: 1,
      },
      salt: bufferFrom('', 'hex'),
      hash: bufferFrom(
        'd9ZXYjhleyA7GcpCwYoEl/FrSETjB0ro39/6P+3iFEL80Aad7QlI+DJqdToPyB8X6NPg+y4NNijPNeIMONGJBg',
        'base64',
      ),
    },
    {
      id: 'argon2i',
      version: 19,
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: 'sRlHhRmKUGzdOmXn01XmXygd5Kc',
      },
      salt: bufferFrom('iHSDPHzUhPzK7rCcJgOFfg', 'base64'),
      hash: bufferFrom(
        'J4moa2MM0/6uf3HbY2Tf5Fux8JIBTwIhmhxGRbsY14qhTltQt+Vw3b7tcJNEbk8ium8AQfZeD4tabCnNqfkD1g',
        'base64',
      ),
    },
  ],
};
const sData = {
  serialized: [
    '$argon2i$v=19$m=120,t=5000,p=2,keyid=Hj5+dsK0,data=sRlHhRmKUGzdOmXn01XmXygd5Kc$iHSDPHzUhPzK7rCcJgOFfg$J4moa2MM0/6uf3HbY2Tf5Fux8JIBTwIhmhxGRbsY14qhTltQt+Vw3b7tcJNEbk8ium8AQfZeD4tabCnNqfkD1g',
  ],
  deserialized: [
    {
      id: 'argon2i',
      version: 19,
      params: {
        m: 120,
        t: 5000,
        p: 2,
        keyid: 'Hj5+dsK0',
        data: bufferFrom('sRlHhRmKUGzdOmXn01XmXygd5Kc', 'base64'),
      },
      salt: bufferFrom('iHSDPHzUhPzK7rCcJgOFfg', 'base64'),
      hash: bufferFrom(
        'J4moa2MM0/6uf3HbY2Tf5Fux8JIBTwIhmhxGRbsY14qhTltQt+Vw3b7tcJNEbk8ium8AQfZeD4tabCnNqfkD1g',
        'base64',
      ),
    },
  ],
};
