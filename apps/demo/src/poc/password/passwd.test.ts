import { pbkdf2 } from 'node:crypto';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import { pbkdf2Sync } from 'crypto';
import { test, expect } from 'vitest';

test('password', async () => {
  // $argon2id$v=19$m=65536,t=3,p=4$0uRRYl7tJwiTEQey/BhdAw$50hJgZyLbMRTuq7gqMVlwVgezt4MXO+VgZ+nAP+BlPw
  console.log(await argon2.hash('password'));
  // $2b$10$vOfyRshCBYnrvdedjscV5eVnSkRv/OoBBmLv43JA2DDSoq49cc7KC
  console.log(await bcrypt.hash('password', 10));

  console.log(pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512').toString('hex'));

  expect(
    parsePassword('$argon2id$v=19$m=65536,t=3,p=4$0uRRYl7tJwiTEQey/BhdAw$50hJgZyLbMRTuq7gqMVlwVgezt4MXO+VgZ+nAP+BlPw'),
  ).toMatchSnapshot();
  expect(parsePassword('$2b$10$vOfyRshCBYnrvdedjscV5eVnSkRv/OoBBmLv43JA2DDSoq49cc7KC')).toMatchSnapshot();
});

const Names: Record<string, string> = {
  sha: 'sha1',
  ssha: 'ssha1',
  1: 'md5',
  5: 'sha256',
  6: 'sha512',
  // 2a Blowfish / bcrypt
  '2b': 'bcrypt',
};

/**
 * @see https://github.com/P-H-C/phc-string-format/blob/master/phc-sf-spec.md
 */
export interface ParsedPassword {
  id: string;
  name: string;
  salt?: string;
  version?: string;
  options: Record<string, string>;
  hash: string;
  round?: number;
}

function parsePassword(s: string): ParsedPassword | undefined {
  // $<id>[$v=<version>][$<param>=<value>(,<param>=<value>)*][$<salt>[$<hash>]]
  // salt hash
  // https://www.php.net/password_hash
  // ^$(sha|sha(1|256|512)|md5|5|6)$(\d+$)?
  // ^$s(sha|sha(1|256|512)|md5)$(\d+$)?$(?<salt>[^$]+)$
  // base64 salt 16byte, hash 24byte
  // ^$(2a|2x|2y)$(?<cost>\d+)$(?<salt>[^$]+)$

  if (!s || !s.startsWith('$')) {
    return;
  }
  const sp = s.split('$');
  sp.shift();
  let id = sp.shift();
  let hash = sp.pop();
  if (!id || !hash) {
    return;
  }
  let round: number | undefined;
  let salt: string | undefined;
  let params: string | undefined;
  let version: string | undefined;
  let options: Record<string, string> = {};

  if (sp.length) {
    // rounds=iterations
    switch (id) {
      // 可能有 iterations
      case 'sha':
      case 'sha1':
      // salted
      case 'md5':
        break;
      case 'smd5':
      case 'ssha':
      case 'ssha1':
        salt = sp.pop();
        break;
      case 'argon2d':
      case 'argon2i':
      case 'argon2id': {
        salt = sp.pop();
        if (salt && /^([a-z0-9]+=[^,]+)/.test(salt)) {
          params = salt;
          salt = undefined;
        }
        params ||= sp.pop();
        if (params?.startsWith('v=')) {
          version = params;
          params = undefined;
        }
        if (params) {
          options = Object.fromEntries(params?.split(',').map((v) => v.split('=')));
        }
        version ||= sp.pop();
        if (version?.startsWith('v=')) {
          version = version?.slice(2);
        }
        break;
      }

      case '2a':
      case '2b':
      case 'bcrypt':
        {
          let v = sp.pop();
          if (v) {
            if (/^\d+$/.test(v)) {
              round = parseInt(v);
            }
          }
        }
        break;
      case '2x':
      case '2y':
      case 'pbkdf2':
      case 'scrypt':
    }
  }

  // not resolved
  if (sp.length) {
    return;
  }

  return {
    id,
    name: Names[id] ?? id,
    salt,
    round,
    hash,
    options,
    version,
  };
}
