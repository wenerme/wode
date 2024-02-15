export type Int32 = number;
export type Float32 = number;
export type Handler = {
  readonly id: Int32;
};
export type PageHandler = Handler;
export type ResourceHandler = Handler;
export type FileHandler = Handler;

export interface Runtime<
  StringHandler = Handler,
  PageHandler = Handler,
  ResourceHandler = Handler,
  FileHandler = Handler,
> {
  FloatToInt: (v: Float32) => Int32;
  IntToFloat: (v: Int32) => Float32;

  AllocString: () => StringHandler;
  StringToInt: (hdr: StringHandler) => Int32;
  IntToString: (dst: StringHandler, v: Int32) => void;
  StringCopy: (dst: StringHandler, src: StringHandler) => void;
  StringConcat: (a: StringHandler, b: StringHandler) => void;
  StringLength: (hdr: StringHandler) => Int32;
  FreeString: (hdr: StringHandler) => void;
  StringCompare: (a: StringHandler, b: StringHandler) => Int32;
  IntToFloatToString: (dst: StringHandler, v: Int32) => void;
  StringToFloat: (hdr: StringHandler) => Float32;
  StringGetAscii: (hdr: StringHandler, idx: Int32) => Int32;
  StringSetAscii: (hdr: StringHandler, idx: Int32, v: Int32) => void;

  StringGet: (hdr: StringHandler) => string;
  StringSet: (hdr: StringHandler, v: string) => void;
  StringOf: (hdr: Int32) => StringHandler;

  // in 14,unknown
  Tick: () => Int32;

  // Math
  Sin: (a: Float32) => Float32;
  Cos: (a: Float32) => Float32;
  Tan: (a: Float32) => Float32;
  Sqrt: (a: Float32) => Float32;
  IntAbs: (a: Int32) => Int32;
  FloatAbs: (a: Float32) => Float32;

  // Memory
  DataPtrSet: (v: Int32) => void;
  Read: (addr: Int32) => Int32;
  Write: (addr: Int32, v: Int32) => void;

  // rt
  GetEnv: () => Int32;

  // string
  StringLeft: (dst: StringHandler, hdr: StringHandler, len: Int32) => void;
  StringRight: (dst: StringHandler, hdr: StringHandler, len: Int32) => void;
  StringMid: (dst: StringHandler, hdr: StringHandler, idx: Int32, len: Int32) => void;
  StringFirstAscii: (hdr: StringHandler) => Int32;
  StringFind: (hdr: StringHandler, sub: StringHandler, offset: Int32) => Int32;

  // out
  PrintLnInt: (v: Int32) => void;
  PrintLnString: (v: StringHandler) => void;
  PrintString: (v: StringHandler) => void;
  PrintInt: (v: Int32) => void;
  PrintChar: (v: Int32) => void;
  PrintFloat: (v: Float32) => void;

  // in
  InputInt: () => Int32;
  InputString: (dst: StringHandler) => void;
  InputFloat: () => Float32;

  //
  DataReadInt: () => Int32;
  DataReadString: (hdr: StringHandler) => void;
  DataReadFloat: () => Float32;

  //
  SetLcd: (w: Int32, h: Int32) => void;
  AllocPage: () => PageHandler;
  FreePage: (hdr: PageHandler) => void;
  LoadImage: (fn: StringHandler, idx: Int32) => ResourceHandler;
  ShowPic: (
    page: PageHandler,
    res: ResourceHandler,
    dx: Int32,
    dy: Int32,
    w: Int32,
    h: Int32,
    x: Int32,
    y: Int32,
    mode: Int32,
  ) => void;
  FlipPage: (hdr: PageHandler) => void;
  PageCopy: (dst: PageHandler, src: PageHandler) => void;
  PageFill: (hdr: PageHandler, x: Int32, y: Int32, w: Int32, h: Int32, color: Int32) => void;
  PagePixel: (hdr: PageHandler, x: Int32, y: Int32, color: Int32) => void;
  PageReadPixel: (hdr: PageHandler, x: Int32, y: Int32) => Int32;
  FreeRes: (hdr: ResourceHandler) => void;

  // out:"27,0"
  Delay: (msec: Int32) => void;
  // out:"32,0"
  RandSeed: (seed: Int32) => void;
  // out:"33,0"
  Rand: (n: Int32) => Int32;

  //
  IsKeyPressed: (k: Int32) => Int32;
  Clear: () => void;
  LocateCursor: (line: Int32, row: Int32) => void;
  SetColor: (font: Int32, back: Int32, frame: Int32) => void;
  SetFont: (font: Int32) => void;
  WaitKey: () => Int32;

  //
  GetImageWidth: (hdr: ResourceHandler) => Int32;
  GetImageHeight: (hdr: ResourceHandler) => Int32;

  PixelLocateCursor: (x: Int32, y: Int32) => void;
  PageCopyExt: (dst: ResourceHandler, src: ResourceHandler, x: Int32, y: Int32) => void;
  SetBackgroundMode: (mod: Int32) => void;

  //
  InputKeyCode: (dst: StringHandler) => void;

  //
  OpenFile: (fd: Int32, fn: StringHandler, mode: Int32) => void;
  CloseFile: (fd: Int32) => void;
  FileReadInt: (fd: Int32, offset: Int32) => Int32;
  FileReadFloat: (fd: Int32, offset: Int32) => Float32;
  FileReadString: (fd: Int32, offset: Int32, dst: StringHandler) => void;
  FileWriteInt: (fd: Int32, offset: Int32, v: Int32) => void;
  FileWriteFloat: (fd: Int32, offset: Int32, v: Float32) => void;
  FileWriteString: (fd: Int32, offset: Int32, v: StringHandler) => void;
  FileEof: (fd: Int32) => Int32;
  FileLof: (fd: Int32) => Int32;
  FileLoc: (fd: Int32) => Int32;
  FileSeek: (fd: Int32, loc: Int32) => void;

  //
  SetPen: (page: PageHandler, style: Int32, wid: Int32, color: Int32) => void;
  SetBrush: (page: PageHandler, style: Int32) => void;
  MoveTo: (page: PageHandler, x: Int32, y: Int32) => void;
  LineTo: (page: PageHandler, x: Int32, y: Int32) => void;
  DrawRectangle: (page: PageHandler, left: Int32, top: Int32, right: Int32, bottom: Int32) => void;
  DrawCircle: (page: PageHandler, cx: Int32, cy: Int32, cr: Int32) => void;

  PageCopyExt2: (
    dst: PageHandler,
    src: PageHandler,
    x: Int32,
    y: Int32,
    w: Int32,
    h: Int32,
    cx: Int32,
    cy: Int32,
  ) => void;
  PageOf: (hdr: Int32) => PageHandler;
  ResOf: (hdr: Int32) => ResourceHandler;

  VmTest: () => void;

  BytesToString: (b: Uint8Array) => string;
  StringToBytes: (s: string) => Uint8Array;
}

export interface VM {
  memory: Uint8Array;
  RP: Register;
  RF: Register;
  RS: Register;
  RB: Register;
  R0: Register;
  R1: Register;
  R2: Register;
  R3: Register;
}

export enum RegisterType {
  RP, // 程序计数器,指令寻址寄存器
  RF, // 标志寄存器,存储比较操作结果
  RS, // 栈寄存器 - 空栈顶地址，指向的是下一个准备要压入数据的位置
  RB, // 辅助栈寄存器 - 栈开始的地址（文件长度+2）
  R0, // #0 寄存器
  R1, // #1 寄存器
  R2, // #2 寄存器
  R3, // #3 寄存器
}

export interface Register {
  Float: Float32;
  Int: Int32;
}

export interface Instruction {
  dataType: DataType;
  calculateType: CalculateType;
  opcode: Opcode;
  compareType: CompareType;
  a: Operand;
  b: Operand;

  file?: string;
  line?: number;
  comment?: string;
}

export enum AddressMode {
  Register, // 寄存器寻址
  RegisterDeferred, // 寄存器间接寻址
  Immediate, // 立即数
  Direct, // 直接寻址
}

export interface Operand {
  value: Int32;
  mode: AddressMode;
  symbol?: string;
}

export enum Opcode {
  NOP,
  LD,
  PUSH,
  POP,
  IN,
  OUT,
  JMP,
  JPC,
  CALL,
  RET,
  CMP,
  CAL,
  EXIT = 0xf,
}

export const enum CompareType {
  Z = 1, // Equal
  B, // Blow
  BE, // Blow or Equal
  A, // Above
  AE, // Above or Equal
  NZ, // Not Equal
}

export const enum DataType {
  DWORD,
  WORD,
  BYTE,
  FLOAT,
  INT,
}

export const enum CalculateType {
  ADD,
  SUB,
  MUL,
  DIV,
  MOD,
}
