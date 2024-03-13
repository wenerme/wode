import { CompareType, Opcode } from '@/poc/bbvm/types';

export function getOpcodeLength(op: Opcode) {
  switch (op) {
    case Opcode.NOP:
    case Opcode.RET:
    case Opcode.EXIT:
      return 1;
    case Opcode.PUSH:
    case Opcode.POP:
    case Opcode.JMP:
    case Opcode.CALL:
      return 5;
    case Opcode.JPC:
      return 6;
    case Opcode.LD:
    case Opcode.IN:
    case Opcode.OUT:
    case Opcode.CMP:
    case Opcode.CAL:
      return 10;
  }
  throw new Error(`Unexpected op(${op})`);
}

export function isCompareTypeMatch(a: CompareType, b: CompareType) {
  if (a === b) {
    return true;
  }
  switch (a) {
    case CompareType.A: {
      switch (b) {
        case CompareType.AE:
        case CompareType.NZ:
          return true;
      }
      break;
    }
    case CompareType.B: {
      switch (b) {
        case CompareType.BE:
        case CompareType.NZ:
          return true;
      }
      break;
    }
    case CompareType.Z: {
      switch (b) {
        case CompareType.BE:
        case CompareType.AE:
          return true;
      }
    }
    case CompareType.NZ: {
      switch (b) {
        case CompareType.B:
        case CompareType.A:
          return true;
      }
      break;
    }
    case CompareType.AE: {
      switch (b) {
        case CompareType.A:
        case CompareType.Z:
          return true;
      }
      break;
    }
    case CompareType.BE: {
      switch (b) {
        case CompareType.B:
        case CompareType.Z:
          return true;
      }
    }
  }
  return false;
}
