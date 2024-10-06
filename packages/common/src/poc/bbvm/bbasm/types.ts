import { AddressMode, Instruction, Opcode, Operand } from '../types';
import { Location } from './parser';

export interface Assembly extends Instruction {
  op: AsmOpCode;
  dataTypeName?: string;
  calculateTypeName?: string;
  compareTypeName?: string;
  a: AsmOperand;
  b: AsmOperand;
  values?: AsmValue[];
  symbol?: string; // for label
  address?: number; // symbol -> address
  length?: number; //
  location?: Location;
}

export type AsmValue =
  | {
      type: 'hex';
      hex: string;
    }
  | {
      type: 'int';
      value: number;
    }
  | {
      type: 'float';
      value: number;
    }
  | number
  | string;

export interface AsmOperand extends Operand {
  symbol?: string;
  value: number;
}

export const AsmAddressModes: Record<
  string,
  {
    name: string;
    code?: AddressMode;
  }
> = {
  Register: {
    name: 'Register',
    code: AddressMode.Register,
  },
  RegisterDeferred: {
    name: 'RegisterDeferred',
    code: AddressMode.RegisterDeferred,
  },
  Immediate: {
    name: 'Immediate',
    code: AddressMode.Immediate,
  },
  Direct: {
    name: 'Direct',
    code: AddressMode.Direct,
  },
  // Symbol: {
  //   name: 'Symbol',
  // },
  // SymbolDeferred: {
  //   name: 'SymbolDeferred',
  // },
};

export type AsmAddressMode = (typeof AsmAddressModes)[keyof typeof AsmAddressModes] & string;
export type AssemblyCompileContext = {
  asm: Assembly;
  buffer: DataView;
  offset: number;
};

interface AsmOpCodeInfo {
  name: string;
  pseudo?: boolean;
  code?: Opcode;
  getLength?(asm: Assembly): number;
  compile?(ctx: AssemblyCompileContext): void;
}

export const AsmOpCodes: Record<string, AsmOpCodeInfo> = {
  DATA: {
    name: 'DATA',
    pseudo: true,
    getLength: (asm: Assembly) => {
      return asm.values?.map(getAsmValueLength).reduce((a, b) => a + b, 0) ?? 0;
    },
    compile: ({ asm, buffer, offset }: AssemblyCompileContext) => {
      asm.values?.forEach((v) => {
        if (typeof v === 'number') {
          isInt(v) ? buffer.setInt32(offset, v) : buffer.setFloat32(offset, v);
          offset += 4;
          return;
        }
        if (typeof v === 'string') {
          // fixme encoding
          let out = new TextEncoder().encode(v);
          for (let i = 0; i < out.length; i++) {
            buffer.setUint8(offset + i, out[i]);
          }
          offset += out.length;
          return;
        }
        if (v && typeof v === 'object' && v.type === 'hex') {
          const hex = v.hex;
          for (let i = 0; i < hex.length; i += 2) {
            buffer.setUint8(offset + i / 2, parseInt(hex.slice(i, i + 2), 16));
          }
          offset += hex.length / 2;
          return;
        }
        throw new Error(`Unknown value type: ${v}`);
      });
    },
  },
  LABEL: {
    name: 'LABEL',
    pseudo: true,
  },
  COMMENT: {
    name: 'COMMENT',
    pseudo: true,
  },
  BLOCK: {
    name: 'BLOCK',
    pseudo: true,
    getLength: (asm: Assembly) => {
      return 8;
    },
    compile: ({ asm, buffer, offset }: AssemblyCompileContext) => {
      buffer.setInt32(offset, asm.values![0] as number);
      buffer.setInt32(offset + 1, asm.values![1] as number, true);
    },
  },
  CALL: {
    name: 'CALL',
    code: Opcode.CALL,
  },
  IN: {
    name: 'IN',
    code: Opcode.IN,
  },
  JMP: {
    name: 'JMP',
    code: Opcode.JMP,
  },
  JPC: {
    name: 'JPC',
    code: Opcode.JPC,
  },
  LD: {
    name: 'LD',
    code: Opcode.LD,
  },
  NOP: {
    name: 'NOP',
    code: Opcode.NOP,
  },
  OUT: {
    name: 'OUT',
    code: Opcode.OUT,
  },
  POP: {
    name: 'POP',
    code: Opcode.POP,
  },
  PUSH: {
    name: 'PUSH',
    code: Opcode.PUSH,
  },
  CAL: {
    name: 'CAL',
    code: Opcode.CAL,
  },
  RET: {
    name: 'RET',
    code: Opcode.RET,
  },
  CMP: {
    name: 'CMP',
    code: Opcode.CMP,
  },
  EXIT: {
    name: 'EXIT',
    code: Opcode.EXIT,
  },
};
export type AsmOpCode = (typeof AsmOpCodes)[keyof typeof AsmOpCodes] & string;

export function getAsmValueLength(v: AsmValue) {
  if (typeof v === 'number') {
    return 4;
  }
  if (typeof v === 'string') {
    return v.length; // fixme cjk
  }
  switch (v.type) {
    case 'hex':
      return v.hex.length / 2;
    case 'int':
      return 4;
    case 'float':
      return 4;
  }
  throw new Error(`Unknown value type: ${v}`);
}

function isInt(value: number) {
  return value === (value | 0);
}

export const AsmCodes = {
  Register: 0,
  RegisterDeferred: 1,
  Immediate: 2,
  Direct: 3,
  RP: 0,
  RF: 1,
  RS: 2,
  RB: 3,
  R0: 4,
  R1: 5,
  R2: 6,
  R3: 7,
  DWORD: 0,
  WORD: 1,
  BYTE: 2,
  FLOAT: 3,
  INT: 4,
};
