import { BasicVm } from '@src/poc/bbvm/BBVM';
import { compile } from '@src/poc/bbvm/bbasm/bbasm';
import { hexdump } from '@src/poc/bbvm/bbasm/hexdump';
import { parse } from '@src/poc/bbvm/bbasm/parser';
import { formatInstruction } from '@src/poc/bbvm/format';
import { marshalInstruction } from '@src/poc/bbvm/marshalInstruction';
import { readInstruction } from '@src/poc/bbvm/readInstruction';
import { getOpcodeLength } from '@src/poc/bbvm/rt';
import { test, expect } from 'vitest';

test('vm', async () => {
  const out = parse(
    `
JMP CODE
DATA STR CHAR "Hello, BBvm",0
CODE:

OUT 1, STR
EXIT
  `,
  );
  const bin = compile(out);
  const vm = new BasicVm();
  vm.load(bin);

  vm.on('next', (inst) => {
    const len = getOpcodeLength(vm.inst.opcode);
    console.log(
      `${String(vm.RP.Int - len).padStart(4, ' ')}+${String(len).padStart(2, ' ')}: ${formatInstruction(vm.inst)}`,
    );
  });

  await vm.run();
});

test('bin', () => {
  const inst = {
    opcode: 6,
    dataType: 0,
    calculateType: 0,
    compareType: 1,
    a: { value: 20, mode: 3 },
    b: { value: 0, mode: 0 },
  };
  let a = formatInstruction(inst);
  // console.log(a);
  let buffer = marshalInstruction(inst);
  // console.log(`BIN ${buffer.byteLength}`);
  // console.log(hexdump(buffer.buffer));
  let exp = formatInstruction(readInstruction(buffer, 0));
  // console.log(exp);
  expect(a).toBe(exp);
});
