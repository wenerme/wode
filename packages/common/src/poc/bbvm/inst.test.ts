import { expect, test } from 'vitest';
import { compile } from '@/poc/bbvm/bbasm/bbasm';
import { hexdump } from '@/poc/bbvm/bbasm/hexdump';
import { parse } from '@/poc/bbvm/bbasm/parser';
import { BasicVm } from '@/poc/bbvm/BBVM';
import { formatInstruction } from '@/poc/bbvm/format';
import { marshalInstruction } from '@/poc/bbvm/marshalInstruction';
import { readInstruction } from '@/poc/bbvm/readInstruction';
import { getOpcodeLength } from '@/poc/bbvm/rt';

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
