import { Simulate } from 'react-dom/test-utils';
import { BasicVm } from '@/poc/bbvm/BBVM';
import { Float32, Handler, Int32, Runtime } from './types';

export class BaseRuntime {
  vm!: BasicVm;
  strings: (StringHdr | undefined)[] = [];
  pages: (PageHdr | undefined)[] = [];
  page: PageHdr;
  resources: (ResHdr | undefined)[] = [];
  files: (FileHdr | undefined)[] = [];

  memory: DataView = new DataView(new Uint8Array(0x10000).buffer);
  ptr: Int32 = 0;

  random = createRandom(0);

  cursor = {
    line: 0,
    row: 0,
  };

  textEncoder = new TextEncoder();
  textDecoder = new TextDecoder('gbk'); // default to gbk

  constructor() {
    this.page = this.AllocPage();
  }

  async reset(vm: BasicVm) {
    this.vm = vm;
    console.clear();
  }

  print(v: string) {
    console.log(`> ${v}`);
  }

  OpenFile(fd: Int32, fn: StringHdr, mode: Int32): void {}

  CloseFile(fd: Int32) {}

  FileReadInt(fd: Int32, offset: Int32): Int32 {
    return 0;
  }

  FileReadFloat(fd: Int32, offset: Int32): Float32 {
    return 0;
  }

  FileReadString(fd: Int32, offset: Int32, dst: StringHdr): void {}

  FileEof(fd: Int32): Int32 {
    return 0;
  }

  FileLoc(fd: Int32): Int32 {
    return 0;
  }

  FileLof(fd: Int32): Int32 {
    return 0;
  }

  FileSeek(fd: Int32, loc: Int32): void {}

  FileWriteInt(fd: Int32, offset: Int32, v: Int32): void {}

  FileWriteFloat(fd: Int32, offset: Int32, v: Float32): void {}

  FileWriteString(fd: Int32, offset: Int32, v: StringHdr): void {}

  DrawRectangle(page: PageHdr, left: Int32, top: Int32, right: Int32, bottom: Int32): void {}

  DrawCircle(page: PageHdr, cx: Int32, cy: Int32, cr: Int32): void {}

  PageCopyExt2(dst: PageHdr, src: PageHdr, x: Int32, y: Int32, w: Int32, h: Int32, cx: Int32, cy: Int32): void {}

  FloatToInt(v: Float32): Int32 {
    return Math.floor(v);
  }

  IntToFloat(v: Float32): Float32 {
    return v;
  }

  AllocString(): StringHdr {
    const id = this.strings.length;
    const ctx = this;
    let hdr = new StringHdr(id);
    this.strings.push(hdr);
    return hdr as StringHdr;
  }

  StringToInt(hdr: StringHdr): Int32 {
    return parseInt(hdr.value, 10);
  }

  IntToString(dst: StringHdr, v: Int32): void {
    dst.value = v.toString();
  }

  StringCopy(dst: StringHdr, src: StringHdr): void {
    dst.value = src.value;
  }

  StringConcat(a: StringHdr, b: StringHdr): void {
    a.value += b.value;
  }

  StringLength(hdr: StringHdr): Int32 {
    return hdr.value.length;
  }

  FreeString(hdr: StringHdr): void {
    this.strings[hdr.id] = undefined;
  }

  StringCompare(a: StringHdr, b: StringHdr): Int32 {
    return a.value.localeCompare(b.value);
  }

  IntToFloatToString(dst: StringHdr, v: Int32): void {
    dst.value = v.toString();
  }

  StringToFloat(hdr: StringHdr): Float32 {
    return parseFloat(hdr.value);
  }

  StringGetAscii(hdr: StringHdr, idx: Int32): Int32 {
    return hdr.value.charCodeAt(idx);
  }

  StringSetAscii(hdr: StringHdr, idx: Int32, v: Int32): void {
    hdr.value = hdr.value.substr(0, idx) + String.fromCharCode(v) + hdr.value.substr(idx + 1);
  }

  StringGet(hdr: StringHdr): string {
    return hdr.value;
  }

  StringSet(hdr: StringHdr, v: string): void {
    hdr.value = v;
  }

  StringOf(hdr: Int32): StringHdr {
    return this.strings[hdr] as StringHdr;
  }

  Tick(): Int32 {
    return 0;
  }

  Sin(a: Float32): Float32 {
    return Math.sin(a);
  }

  Cos(a: Float32): Float32 {
    return Math.cos(a);
  }

  Tan(a: Float32): Float32 {
    return Math.tan(a);
  }

  Sqrt(a: Float32): Float32 {
    return Math.sqrt(a);
  }

  IntAbs(a: Int32): Int32 {
    return Math.abs(a);
  }

  FloatAbs(a: Float32): Float32 {
    return Math.abs(a);
  }

  DataPtrSet(v: Int32): void {
    // fixme
    this.ptr = v;
  }

  Read(addr: Int32): Int32 {
    return this.memory.getInt32(addr, true);
  }

  Write(addr: Int32, v: Int32): void {
    this.memory.setInt32(addr, v, true);
  }

  GetEnv(): Int32 {
    return 0;
  }

  StringLeft(dst: StringHdr, hdr: StringHdr, len: Int32): void {
    dst.value = hdr.value.substr(0, len);
  }

  StringRight(dst: StringHdr, hdr: StringHdr, len: Int32): void {
    dst.value = hdr.value.substr(-len);
  }

  StringMid(dst: StringHdr, hdr: StringHdr, idx: Int32, len: Int32): void {
    dst.value = hdr.value.substr(idx, len);
  }

  StringFirstAscii(hdr: StringHdr): Int32 {
    return hdr.value.charCodeAt(0);
  }

  StringFind(hdr: StringHdr, sub: StringHdr, offset: Int32): Int32 {
    return hdr.value.indexOf(sub.value, offset);
  }

  VmTest(): void {}

  Delay(ms: Int32): void {
    // fixme
  }

  RandSeed(seed: Int32) {
    this.random = createRandom(seed);
  }

  Rand() {
    return this.random();
  }

  IsKeyPressed(key: Int32): Int32 {
    return 0;
  }

  Clear() {}

  LocateCursor(line: Int32, row: Int32) {
    this.cursor.line = line;
    this.cursor.row = row;
  }

  WaitKey() {
    return 0;
  }

  GetImageHeight() {
    return 0;
  }

  GetImageWidth() {
    return 0;
  }

  InputKeyCode(dst: StringHdr) {}

  SetPen(page: PageHdr, style: Int32, wid: Int32, color: Int32) {
    page.penStyle = style;
    page.penWidth = wid;
    page.penColor = color;
  }

  MoveTo(page: PageHdr, x: Int32, y: Int32) {
    page.penX = x;
    page.penY = y;
  }

  LineTo(page: PageHdr, x: Int32, y: Int32) {
    page.penX = x;
    page.penY = y;
  }

  PageOf(hdr: Int32): PageHdr {
    return this.pages[hdr] as PageHdr;
  }

  ResOf(hdr: Int32): ResHdr {
    return this.resources[hdr] as ResHdr;
  }

  BytesToString(b: Uint8Array): string {
    return this.textDecoder.decode(b);
  }

  StringToBytes(s: string): Uint8Array {
    return this.textEncoder.encode(s);
  }

  // SetLcd: (w: Int32, h: Int32) => void;
  // AllocPage: () => PageHdr;
  // FreePage: (hdr: PageHdr) => void;
  // LoadImage: (fn: StringHdr, idx: Int32) => ResHdr;
  SetLcd(w: Int32, h: Int32) {}

  AllocPage(): PageHdr {
    const id = this.pages.length;
    const ctx = this;
    let hdr = new PageHdr(id);
    this.pages.push(hdr);
    return hdr as PageHdr;
  }

  FreePage(hdr: PageHdr) {
    hdr.free = true;
    this.pages[hdr.id] = undefined;
  }

  LoadImage(fn: StringHdr, idx: Int32): ResHdr {
    const id = this.resources.length;
    const ctx = this;
    let hdr = new ResHdr(id);
    this.resources.push(hdr);
    return hdr as ResHdr;
  }

  SetFont(font: Int32) {}

  SetColor(font: Int32, back: Int32, frame: Int32) {}

  PixelLocateCursor(x: Int32, y: Int32) {}

  PageCopyExt(dst: ResHdr, src: ResHdr, x: Int32, y: Int32) {}

  SetBackgroundMode(mod: Int32) {}

  SetBrush(page: PageHdr, style: Int32) {}

  FreeRes(hdr: ResHdr) {
    hdr.free = true;
    this.resources[hdr.id] = undefined;
  }

  FlipPage(hdr: PageHdr) {
    this.page = hdr;
  }

  PrintChar(v: Int32) {}

  PageCopy(dst: PageHdr, src: PageHdr) {}

  PrintFloat(v: Float32) {}

  InputInt() {
    return 0;
  }

  InputString(dst: StringHdr) {}

  InputFloat() {
    return 0;
  }

  DataReadInt() {
    return 0;
  }

  DataReadString(hdr: StringHdr) {}

  DataReadFloat() {
    return 0;
  }

  ShowPic(page: PageHdr, res: ResHdr, dx: Int32, dy: Int32, w: Int32, h: Int32, x: Int32, y: Int32, mode: Int32) {}

  PageFill(hdr: PageHdr, x: Int32, y: Int32, w: Int32, h: Int32, color: Int32) {}

  PagePixel(hdr: PageHdr, x: Int32, y: Int32, color: Int32) {}

  PageReadPixel(hdr: PageHdr, x: Int32, y: Int32) {
    return 0;
  }

  pageOf(hdr: Int32): PageHdr {
    return this.pages[hdr]!;
  }

  strOf(hdr: Int32): StringHdr {
    return this.strings[hdr]!;
  }
}

function createRandom(seed: number | string = Date.now()) {
  let s = typeof seed === 'string' ? 0 : (seed ?? 0);
  if (typeof seed === 'string') {
    let sum = 0;
    for (let i = 0; i < seed.length; i++) {
      sum += seed.charCodeAt(i);
    }
    s = sum;
  }

  return () => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
}

class Hdr extends Number {
  constructor(id: number) {
    super(id);
  }

  get id(): Int32 {
    return +this;
  }

  free = false;
  type: string = '';

  access(reason?: string) {
    if (this.free) {
      throw new Error(`Access freed ${this.type} ${this.id} ${reason}`);
    }
  }
}

class StringHdr extends Hdr {
  type = 'String';
  value: string = '';
}

class PageHdr extends Hdr {
  type = 'Page';
  brushStyle: Int32 = 0;
  penX: Int32 = 0;
  penY: Int32 = 0;
  penStyle: Int32 = 0;
  penWidth: Int32 = 0;
  penColor: Int32 = 0;
}

class ResHdr extends Hdr {
  type = 'Resource';
}

class FileHdr extends Hdr {
  type = 'File';
}
