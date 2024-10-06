import { $ } from 'execa';

interface FindPasswordOptions {
  account?: string;
  creator?: string; // 4 char code
  type?: string; // 4 char code
  securityDomain?: string;
  kind?: string;
  comment?: string;
  label?: string;
  path?: string;
  port?: number;
  protocol?: string; // 4 char code
  server?: string;
  service?: string; // alias server
  authenticationType?: string; // 4 char code
}

/**
 * ```
 * Usage: add-generic-password [-a account] [-s service] [-w password] [options...] [-A|-T appPath] [keychain]
 *     -a  Specify account name (required)
 *     -c  Specify item creator (optional four-character code)
 *     -C  Specify item type (optional four-character code)
 *     -D  Specify kind (default is "application password")
 *     -G  Specify generic attribute (optional)
 *     -j  Specify comment string (optional)
 *     -l  Specify label (if omitted, service name is used as default label)
 *     -s  Specify service name (required)
 *     -p  Specify password to be added (legacy option, equivalent to -w)
 *     -w  Specify password to be added
 *     -X  Specify password data to be added as a hexadecimal string
 *     -A  Allow any application to access this item without warning (insecure, not recommended!)
 *     -T  Specify an application which may access this item (multiple -T options are allowed)
 *     -U  Update item if it already exists (if omitted, the item cannot already exist)
 *
 * By default, the application which creates an item is trusted to access its data without warning.
 * You can remove this default access by explicitly specifying an empty app pathname: -T ""
 * If no keychain is specified, the password is added to the default keychain.
 * Use of the -p or -w options is insecure. Specify -w as the last option to be prompted.
 *
 *         Add a generic password item.
 * ```
 */
interface AddPasswordOptions {
  account: string;
  creator?: string;
  type?: string;
  kind?: string;
  attribute?: string;
  comment?: string;
  label?: string;
  service: string;
  password: string;
  update?: boolean; // -U
  insecure?: boolean; // -A
  allowed?: string[]; // -T
}

/**
 * @see https://github.com/drudge/node-keychain/blob/master/keychain.js
 */
export class KeychainAccess {
  executablePath = '/usr/bin/security';

  private buildFlags(o: Record<string, any>, map: Record<string, string>) {
    const args: string[] = [];
    for (const [k, v] of Object.entries(o)) {
      if (!v) {
        continue;
      }
      const flag = map[k];
      if (!flag) {
        continue;
      }
      if (Array.isArray(v)) {
        v.map((vv) => {
          args.push(`-${flag}`);
          args.push(String(vv));
        });
        continue;
      }
      args.push(`-${flag}`);
      if (v === true) {
        continue;
      }
      args.push(String(v));
    }
    return args;
  }

  async findGenericPassword(filter: FindPasswordOptions) {
    if (process.platform !== 'darwin') {
      throw new Error(`Only macOS is supported: ${process.platform}`);
    }

    const args = this.buildFlags(filter, {
      account: 'a',
      creator: 'c',
      type: 'C',
      securityDomain: 'd',
      kind: 'D',
      comment: 'j',
      label: 'l',
      path: 'p',
      port: 'P',
      protocol: 'r',
      server: 's',
      service: 's',
      authenticationType: 't',
    });
    if (!args.length) {
      return undefined;
    }

    const proc = $`${this.executablePath} ${`find-generic-password`} ${args} -g`;

    const { stderr: password, stdout: keychain, exitCode } = await proc;

    if (/password/.test(password)) {
      // When keychain escapes a char into octal it also includes a hex
      // encoded version.
      //
      // e.g. password 'passWith\' becomes:
      // password: 0x70617373576974685C  "passWith\134"
      //
      // And if the password does not contain ASCII it leaves out the quoted
      // version altogether:
      //
      // e.g. password '∆˚ˆ©ƒ®∂çµ˚¬˙ƒ®†¥' becomes:
      // password: 0xE28886CB9ACB86C2A9C692C2AEE28882C3A7C2B5CB9AC2ACCB99C692C2AEE280A0C2A5
      if (/^password: 0x([0-9a-fA-F]+)/.test(password)) {
        var hexPassword = password.match(/0x([0-9a-fA-F]+)/)?.[1];
        if (!hexPassword) {
          return;
        }
        return Buffer.from(hexPassword, 'hex').toString();
      }
      // Otherwise the password will be in quotes:
      // password: "passWithoutSlash"
      else {
        const out = password.match(/"(.*)\"/)?.[1];
        return out;
      }
    }
  }

  async addGenericPassword({ password, ...filter }: AddPasswordOptions & { password: string }) {
    let args = this.buildFlags(filter, {
      account: 'a',
      creator: 'c',
      type: 'C',
      kind: 'D',
      attribute: 'G',
      comment: 'j',
      label: 'l',
      service: 's',
      password: 'w',
      update: 'U',
      insecure: 'A',
      allowed: 'T',
    });

    const proc = $`${this.executablePath} ${`add-generic-password`} ${args}`;
    const { exitCode } = await proc;
    if (exitCode === 45) {
      // The specified item already exists in the keychain
    }
  }
}
