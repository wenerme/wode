import { marshalInstruction } from '@src/poc/bbvm/marshalInstruction';
import { getOpcodeLength } from '@src/poc/bbvm/rt';
import { Instruction, Opcode } from '@src/poc/bbvm/types';
import { parse, ParseOptions } from './parser';
import { AsmOpCodes, Assembly } from './types';

export function parseAssembly(input: string, options?: ParseOptions) {
  return parse(input, options) as Assembly[];
}

export function compile(all: Assembly[]) {
  // address
  const symbols: Record<
    string,
    {
      symbol: string;
      address: number;
    }
  > = {};
  const pendingSymbols: {
    symbol: string;
    value?: number;
  }[] = [];
  let address = 0;

  // resolve address
  for (const asm of all) {
    const op = AsmOpCodes[asm.op];
    let len = 0;
    if (!op) {
      throw new Error(`Unknown op: ${asm.op} ${JSON.stringify(asm)}`);
    } else if (!op.pseudo && op.code !== undefined) {
      asm.opcode = op.code;
      len = getOpcodeLength(op.code);
    } else if (op.getLength) {
      len = op.getLength(asm);
    }

    asm.address = address;
    asm.length = len;
    address += len;

    switch (asm.op) {
      case AsmOpCodes.DATA.name:
      case AsmOpCodes.LABEL.name:
        if (!asm.symbol) {
          continue;
        }
        symbols[asm.symbol] = asm as any;
        continue;
      case AsmOpCodes.COMMENT.name:
        continue;
    }
    if (asm.a) {
      if (asm.a.symbol && asm.a.value === undefined) {
        pendingSymbols.push(asm.a as any);
      }
    }
    if (asm.b) {
      if (asm.b.symbol && asm.b.value === undefined) {
        pendingSymbols.push(asm.b as any);
      }
    }
  }

  // resolve symbol address
  for (let s of pendingSymbols) {
    const ss = symbols[s.symbol];
    if (!ss) {
      throw new Error(`Symbol not found: ${s.symbol}`);
    }
    s.value = ss.address;
  }

  // compile
  const out = new ArrayBuffer(address);
  const buffer = new DataView(out);
  for (const asm of all) {
    const op = (AsmOpCodes as any)[asm.op];
    if (!op) {
      throw new Error(`Unknown op: ${asm.op}`);
    }
    if (op.compile) {
      op.compile({ asm, buffer, offset: asm.address });
    } else if (asm.opcode) {
      marshalInstruction(asm, buffer, asm.address);
    }
  }
  return out;
}

function assert<T>(v: T | undefined | null, message?: string): T {
  if (v === undefined || v === null) {
    throw new Error(message || 'requireDefined');
  }
  return v;
}
