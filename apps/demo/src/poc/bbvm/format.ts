import { getOpcodeLength } from './rt';
import { AddressMode, CalculateType, DataType, Instruction, Opcode, Operand, RegisterType } from './types';

export function formatDateType(value: DataType) {
  switch (value) {
    case DataType.DWORD:
      return 'DWORD';
    case DataType.WORD:
      return 'WORD';
    case DataType.BYTE:
      return 'BYTE';
    case DataType.FLOAT:
      return 'FLOAT';
    case DataType.INT:
      return 'INT';
    default:
      return `DataType(${value})`;
  }
}

export function formatAddressMode(value: AddressMode) {
  switch (value) {
    case AddressMode.Register:
      return 'Register';
    case AddressMode.RegisterDeferred:
      return 'RegisterDeferred';
    case AddressMode.Immediate:
      return 'Immediate';
    case AddressMode.Direct:
      return 'Direct';
    default:
      return `AddressMode(${value})`;
  }
}

export function formatOpcode(value: Opcode) {
  switch (value) {
    case Opcode.NOP:
      return 'NOP';
    case Opcode.LD:
      return 'LD';
    case Opcode.PUSH:
      return 'PUSH';
    case Opcode.POP:
      return 'POP';
    case Opcode.IN:
      return 'IN';
    case Opcode.OUT:
      return 'OUT';
    case Opcode.JMP:
      return 'JMP';
    case Opcode.JPC:
      return 'JPC';
    case Opcode.CALL:
      return 'CALL';
    case Opcode.RET:
      return 'RET';
    case Opcode.CMP:
      return 'CMP';
    case Opcode.CAL:
      return 'CAL';
    case Opcode.EXIT:
      return 'EXIT';
    default:
      return `OpcodeCode(${value})`;
  }
}

export function formatRegisterType(value: RegisterType) {
  switch (value) {
    case RegisterType.RP:
      return 'RP';
    case RegisterType.RF:
      return 'RF';
    case RegisterType.RS:
      return 'RS';
    case RegisterType.RB:
      return 'RB';
    case RegisterType.R0:
      return 'R0';
    case RegisterType.R1:
      return 'R1';
    case RegisterType.R2:
      return 'R2';
    case RegisterType.R3:
      return 'R3';
    default:
      return `RegisterType(${value})`;
  }
}

export function formatDataType(value: CalculateType) {
  switch (value) {
    case CalculateType.ADD:
      return 'ADD';
    case CalculateType.SUB:
      return 'SUB';
    case CalculateType.MUL:
      return 'MUL';
    case CalculateType.DIV:
      return 'DIV';
    case CalculateType.MOD:
      return 'MOD';
    default:
      return `CalculateType(${value})`;
  }
}

export function formatInstruction(inst: Instruction) {
  function formatPureInst(inst: Instruction) {
    switch (getOpcodeLength(inst.opcode)) {
      case 1:
        return `${formatOpcode(inst.opcode)}`;
      case 5:
        return `${formatOpcode(inst.opcode)} ${formatOperand(inst.a)}`;
      case 10:
        switch (inst.opcode) {
          case Opcode.CAL:
            return `${formatOpcode(inst.opcode)} ${formatDateType(inst.dataType)} ${formatDataType(inst.calculateType)} ${formatOperand(inst.a)}, ${formatOperand(inst.b)}`;
          case Opcode.LD:
            return `${formatOpcode(inst.opcode)} ${formatDateType(inst.dataType)} ${formatOperand(inst.a)}, ${formatOperand(inst.b)}`;
          case Opcode.CMP:
            return `${formatOpcode(inst.opcode)} ${inst.compareType} ${formatOperand(inst.a)}, ${formatOperand(inst.b)}`;
          default:
            return `${formatOpcode(inst.opcode)} ${formatOperand(inst.a)}, ${formatOperand(inst.b)}`;
        }
      case 6:
        return `${formatOpcode(inst.opcode)} ${inst.compareType} ${formatOperand(inst.a)}`;
      default:
        throw new Error('Unknown opcode len');
    }
  }

  let s = formatPureInst(inst);
  if (inst.comment) {
    s += ` ; ${inst.comment}`;
  }
  return s;
}

export function formatOperand(value: Operand) {
  switch (value.mode) {
    case AddressMode.Register:
      return formatRegisterType(value.value);
    case AddressMode.RegisterDeferred:
      return `[ ${formatRegisterType(value.value)} ]`;
    case AddressMode.Immediate:
      return `${value.value}`;
    case AddressMode.Direct:
      return `[ ${value.value} ]`;
    default:
      return `Invalid Operand address mode ${value.mode}`;
  }
}
