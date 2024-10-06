import { EventEmitter } from 'eventemitter3';
import { BaseRuntime } from './BaseRuntime';
import { float32bits, float32frombits } from './lib';
import { readInstruction } from './readInstruction';
import { getOpcodeLength } from './rt';
import { AddressMode, Float32, Instruction, Opcode, Operand, Register, VM } from './types';

enum VmState {
  New,
  Init,
  Running,
  Exit,
}

enum SyscallMode {
  Reset,
  IN,
  OUT,
}

interface VmEventTypes {
  load: ArrayBuffer;
  reset: void;
  start: void;
  next: Instruction;
  exit: void;
}

export class BasicVm extends EventEmitter<VmEventTypes> implements VM {
  memory: Uint8Array = new Uint8Array(0); // max 4mb
  view: DataView = new DataView(this.memory.buffer);
  syscall: SysCall = createBasicSyscall();
  state: VmState = VmState.New;

  R0 = this.createRegister();
  R1 = this.createRegister();
  R2 = this.createRegister();
  R3 = this.createRegister();
  RB = this.createRegister();
  RF = this.createRegister();
  RP = this.createRegister();
  RS = this.createRegister();
  rt = new BaseRuntime();

  registers = [this.R0, this.R1, this.R2, this.R3, this.RB, this.RF, this.RP, this.RS];

  length = 0;
  inst: Instruction = {
    opcode: Opcode.NOP,
    dataType: 0,
    calculateType: 0,
    compareType: 1,
    a: { value: 0, mode: 0 },
    b: { value: 0, mode: 0 },
  };

  load(data: ArrayBuffer) {
    // +2kb for stack
    this.memory = new Uint8Array(data.byteLength + 2 * 1024);
    this.memory.set(new Uint8Array(data));
    this.view = new DataView(this.memory.buffer);
    this.length = data.byteLength;

    this.emit('load', data);

    this.reset();
  }

  reset() {
    this.state = VmState.Init;
    this.R0.Int = 0;
    this.R1.Int = 0;
    this.R2.Int = 0;
    this.R3.Int = 0;
    this.RB.Int = 0;
    this.RF.Int = 0;
    this.RP.Int = 0;
    this.RS.Int = 0;

    this.RB.Int = this.length + 2;

    this.syscall(this, SyscallMode.Reset, 0, 0);
    this.emit('reset');
  }

  start() {
    this.state = VmState.Running;
    this.emit('start');
  }

  async run() {
    this.start();
    while (this.state === VmState.Running) {
      this.next();
      await this.exec();
    }
  }

  next() {
    const rp = this.RP.Int;
    let buffer = this.view;
    readInstruction(buffer, rp, this.inst);
    this.RP.Int += getOpcodeLength(this.inst.opcode);

    this.emit('next', this.inst);
  }

  op({ mode, value }: Operand) {
    switch (mode) {
      case AddressMode.Register:
        return this.registers[value].Int;
      case AddressMode.RegisterDeferred:
        return this.view.getInt32(this.registers[value].Int, true);
      case AddressMode.Immediate:
        return value;
      case AddressMode.Direct:
        return this.view.getInt32(value, true);
    }
  }

  async _syscall(mode: number, a: number, b: number) {
    await this.syscall(this, mode, a, b);
  }

  async exec() {
    const { opcode, a, b } = this.inst;
    switch (opcode) {
      case Opcode.NOP:
        break;
      case Opcode.LD:
        break;
      case Opcode.PUSH:
        break;
      case Opcode.POP:
        break;
      case Opcode.IN:
      case Opcode.OUT:
        await this._syscall(opcode === Opcode.IN ? 1 : 2, this.op(a), this.op(b));
        break;
      case Opcode.JMP:
        this.RP.Int = this.op(a);
        break;
      case Opcode.JPC:
        break;
      case Opcode.CALL:
        break;
      case Opcode.RET:
        break;
      case Opcode.CMP:
        break;
      case Opcode.CAL:
        break;
      case Opcode.EXIT:
        this.exit();
        break;
    }
  }

  exit() {
    this.state = VmState.Exit;
    this.emit('exit');
  }

  private createRegister(): Register {
    return {
      Int: 0,
      get Float() {
        return float32frombits(this.Int);
      },
      set Float(v: Float32) {
        this.Int = float32bits(v);
      },
    };
  }
}

export type SysCall = (vm: BasicVm, mode: number, a: number, b: number) => void | Promise<void>;

export function createBasicSyscall() {
  const rt = new BaseRuntime();
  const print = rt.print.bind(rt);

  return async (vm: BasicVm, mode: number, a: number, b: number) => {
    const std = rt;

    if (mode === SyscallMode.Reset) {
      await std.reset(vm);
    } else if (mode === SyscallMode.IN) {
      // IN
      console.error(`Unsupported IN: ${a}, ${b}`);
    } else if (mode === SyscallMode.OUT) {
      // OUT
      switch (a) {
        case 0:
          print(`${b}\n`);
          break;
        case 1:
          {
            if (b >= 0) {
              let end = b;
              for (; end < vm.length; end++) {
                if (vm.memory[end] === 0) {
                  break;
                }
              }
              const str = rt.textDecoder.decode(vm.memory.slice(b, end));
              print(str);
            } else {
              // hdr
            }
          }
          break;
        case 2:
          print(`${std.StringOf(b).value}`);
          break;
        case 3:
          print(`${b}`);
          break;
        case 4:
          print(String.fromCharCode(b));
          break;
        case 5:
          print(`${float32frombits(b).toFixed(6)}`);
          break;
        case 255:
          std.VmTest();
          break;
        default:
          console.error(`Unsupported OUT: ${a}, ${b}`);
      }
      /*
	case 10: // 键入整数 | 0 |  | r3的值变为键入的整数
		r3.Set(std.InputInt(ctx))
	case 11: // 键入字符串 | 0 | r3:目标字符串句柄 | r3所指字符串的内容变为键入的字符串
		std.InputString(ctx, std.StringOf(ctx, r3.Get()))
	case 12: // 键入浮点数 | 0 |  | r3的值变为键入的浮点数
		r3.SetFloat(std.InputFloat(ctx))
	case 27: // 延迟一段时间 | 0 | r3:延迟时间 |  MSDELAY(MSEC)
		std.Delay(ctx, r3.Get())
	case 32: // 用种子初始化随机数生成器 | 0 | r3:SEED |  RANDOMIZE(SEED)
		std.RandSeed(ctx, r3.Get())
	case 33: // 获取范围内随机数 | 0 | r3:RANGE |  RND(RANGE)
		r3.Set(std.Rand(ctx, r3.Get()))
	case 255: // 虚拟机测试 | 0 | 0 |  VmTest
		std.VmTest(ctx)
       */
    }
  };
}
