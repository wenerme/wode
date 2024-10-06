import { getOpcodeLength } from './rt';
import { Instruction, Opcode } from './types';

export function marshalInstruction(inst: Instruction, view?: DataView, offset?: number) {
  const opcodeLen = getOpcodeLength(inst.opcode);
  if (!view) {
    const buffer = new ArrayBuffer(opcodeLen);
    view = new DataView(buffer);
  }
  offset = offset || 0;

  view.setUint8(offset, (inst.opcode << 4) | inst.dataType);

  switch (opcodeLen) {
    case 1: // 无操作数
      break;
    case 5: // 一个操作数
      view.setUint8(offset, (inst.opcode << 4) | inst.a.mode);
      view.setInt32(offset + 1, inst.a.value, true);
      break;
    case 10: // 两个操作数
      view.setUint8(offset + 1, inst.dataType | (inst.a.mode << 2) | inst.b.mode);
      view.setInt32(offset + 2, inst.a.value, true);
      view.setInt32(offset + 6, inst.b.value, true);

      if (inst.opcode === Opcode.CAL) {
        view.setUint8(offset + 1, view.getUint8(1) | (inst.calculateType << 4));
      }
      break;
    case 6: // JPC
      view.setUint8(offset + 0, inst.compareType);
      view.setUint8(offset + 1, inst.a.mode);
      view.setInt32(offset + 2, inst.a.value, true);
      break;
  }

  return view;
}
