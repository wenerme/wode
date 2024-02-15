import { formatOpcode } from '@src/poc/bbvm/format';
import { getOpcodeLength } from '@src/poc/bbvm/rt';
import { AddressMode, Instruction, Opcode } from '@src/poc/bbvm/types';

export function readInstruction(
  buffer: DataView,
  offset: number,
  out: Instruction = {
    opcode: Opcode.NOP,
    dataType: 0,
    calculateType: 0,
    compareType: 1,
    a: { value: 0, mode: 0 },
    b: { value: 0, mode: 0 },
  },
) {
  /*
    指令码 + 数据类型 + 特殊用途字节 + 寻址方式 + 第一个操作数 + 第二个操作数
    0x 0       0         0           0        00000000     00000000

    无操作数 1byte
    指令码 + 无用
    0x 0       0
    一个操作数 5byte
    指令码 + 寻址方式 + 第一个操作数
    0x 0       0        00000000
    两个操作数 10byte
    指令码 + 数据类型 + 保留字节 + 寻址方式 + 第一个操作数 + 第二个操作数
    0x 0       0         0        0        00000000     00000000
    JPC指令 6byte
    指令码 + 比较操作 + 保留字节 + 寻址方式 + 第一个操作数
    0x 0       0         0        0        00000000
  */

  const opcode = (out.opcode = buffer.getUint8(offset) >> 4) as Opcode;
  const opcodeLen = getOpcodeLength(opcode);
  if (opcodeLen > buffer.byteLength) {
    throw new Error(`Data is not enough for instruction: ${formatOpcode(opcode)}`);
  }

  // reset
  out.compareType = 1;
  out.calculateType = 0;
  out.dataType = 0;
  out.a.mode = AddressMode.Direct;
  out.b.mode = AddressMode.Direct;

  switch (opcodeLen) {
    case 1: // 无操作数
      break;
    case 5: // 一个操作数
      out.a.mode = buffer.getUint8(offset) & 0xf;
      out.a.value = buffer.getInt32(offset + 1, true);
      break;
    case 10: {
      // 两个操作数
      out.dataType = buffer.getUint8(offset + 1) & 0xf;

      let addrMode = buffer.getUint8(offset + 1) & 0xf;
      out.a.mode = Math.floor(addrMode / 4);
      out.b.mode = addrMode % 4;
      out.a.value = buffer.getInt32(offset + 2, true);
      out.b.value = buffer.getInt32(offset + 6, true);

      if (opcode === Opcode.CAL) {
        out.calculateType = buffer.getUint8(offset + 1) >> 4;
      }
      break;
    }
    case 6: // JPC
      out.compareType = buffer.getUint8(offset) & 0xf;
      out.a.mode = buffer.getUint8(offset + 1) & 0xf;
      out.a.value = buffer.getInt32(offset + 2, true);
      break;
  }

  return out;
}
