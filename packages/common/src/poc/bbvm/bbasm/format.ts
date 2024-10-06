import { formatInstruction } from '../format';
import { Assembly } from './types';

export function formatAssembly(asm: Assembly) {
  if (asm.opcode !== undefined) {
    let out = formatInstruction(asm);
    if (asm.comment) {
      out += ` ; ${asm.comment}`;
    }
    return out;
  }
  const { op, comment, symbol, dataTypeName } = asm;

  switch (asm.op) {
    case 'COMMENT':
      return `; ${comment ?? ''}`;
    case 'LABEL':
      return `${symbol}:`;
    case 'DATA': {
      /// todo
      let out = ['DATA', symbol, dataTypeName];
      out.push(
        asm
          .values!.map((v) => {
            if (typeof v === 'string') {
              // escape quotes
              return `"${v.replace(/"/g, '\\"')}"`;
            } else if (typeof v === 'number') {
              return v.toString();
            } else if (v && typeof v === 'object') {
              if (v.type === 'hex') {
                return `%${v.hex}%`;
              }
            } else {
              throw new Error(`Unknown data type: ${v}`);
            }
          })
          .join(', '),
      );
      if (asm.symbol && asm.address !== undefined) {
        out.push(`; ${asm.symbol} = ${asm.address}`);
      }
      return out.filter(Boolean).join(' ');
    }
    case 'BLOCK':
      return `.BLOCK ${asm.values?.[0]} ${asm.values?.[1]}`;
    default:
      throw new Error(`Unknown opcode: ${op}`);
  }
}
