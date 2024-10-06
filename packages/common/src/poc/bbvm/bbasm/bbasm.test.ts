import { expect, test } from 'vitest';
import { compile, parseAssembly } from './bbasm';
import { formatAssembly } from './format';
import { hexdump } from './hexdump';

test('parser', () => {
  const out = parseAssembly(
    `
JMP CODE
DATA STR CHAR "Hello, BBvm",0
CODE:

OUT 1, STR
EXIT
  `,
  );
  let bin = compile(out);
  // console.log(hexdump(bin));
  // console.log(out);

  let de: string[] = [];
  for (let assembly of out) {
    de.push(formatAssembly(assembly));
  }
  // console.log(de.join('\n'));
  expect(bin).toEqual(compile(parseAssembly(de.join('\n'))));
});

test('encoding', () => {
  const gbk = new TextDecoder('gbk');
  // 你好!
  console.log(gbk.decode(new Uint8Array([0xc4, 0xe3, 0xba, 0xc3, 0x21, 0x0a])));
  // e4 bd a0 e5 a5 bd 21
  console.log(hexdump(new TextEncoder().encode('你好!').buffer));
});
