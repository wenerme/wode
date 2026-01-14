
import type { BasicVm } from '@/poc/bbvm/BBVM';
import type { Float32, Int32, } from './types';

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

	cursor = { line: 0, row: 0 };

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

	OpenFile(_fd: Int32, _fn: StringHdr, _mode: Int32): void {}

	CloseFile(_fd: Int32) {}

	FileReadInt(_fd: Int32, _offset: Int32): Int32 {
		return 0;
	}

	FileReadFloat(_fd: Int32, _offset: Int32): Float32 {
		return 0;
	}

	FileReadString(_fd: Int32, _offset: Int32, _dst: StringHdr): void {}

	FileEof(_fd: Int32): Int32 {
		return 0;
	}

	FileLoc(_fd: Int32): Int32 {
		return 0;
	}

	FileLof(_fd: Int32): Int32 {
		return 0;
	}

	FileSeek(_fd: Int32, _loc: Int32): void {}

	FileWriteInt(_fd: Int32, _offset: Int32, _v: Int32): void {}

	FileWriteFloat(_fd: Int32, _offset: Int32, _v: Float32): void {}

	FileWriteString(_fd: Int32, _offset: Int32, _v: StringHdr): void {}

	DrawRectangle(_page: PageHdr, _left: Int32, _top: Int32, _right: Int32, _bottom: Int32): void {}

	DrawCircle(_page: PageHdr, _cx: Int32, _cy: Int32, _cr: Int32): void {}

	PageCopyExt2(_dst: PageHdr, _src: PageHdr, _x: Int32, _y: Int32, _w: Int32, _h: Int32, _cx: Int32, _cy: Int32): void {}

	FloatToInt(v: Float32): Int32 {
		return Math.floor(v);
	}

	IntToFloat(v: Float32): Float32 {
		return v;
	}

	AllocString(): StringHdr {
		const id = this.strings.length;
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

	Delay(_ms: Int32): void {
		// fixme
	}

	RandSeed(seed: Int32) {
		this.random = createRandom(seed);
	}

	Rand() {
		return this.random();
	}

	IsKeyPressed(_key: Int32): Int32 {
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

	InputKeyCode(_dst: StringHdr) {}

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
	SetLcd(_w: Int32, _h: Int32) {}

	AllocPage(): PageHdr {
		const id = this.pages.length;
		let hdr = new PageHdr(id);
		this.pages.push(hdr);
		return hdr as PageHdr;
	}

	FreePage(hdr: PageHdr) {
		hdr.free = true;
		this.pages[hdr.id] = undefined;
	}

	LoadImage(_fn: StringHdr, _idx: Int32): ResHdr {
		const id = this.resources.length;
		let hdr = new ResHdr(id);
		this.resources.push(hdr);
		return hdr as ResHdr;
	}

	SetFont(_font: Int32) {}

	SetColor(_font: Int32, _back: Int32, _frame: Int32) {}

	PixelLocateCursor(_x: Int32, _y: Int32) {}

	PageCopyExt(_dst: ResHdr, _src: ResHdr, _x: Int32, _y: Int32) {}

	SetBackgroundMode(_mod: Int32) {}

	SetBrush(_page: PageHdr, _style: Int32) {}

	FreeRes(hdr: ResHdr) {
		hdr.free = true;
		this.resources[hdr.id] = undefined;
	}

	FlipPage(hdr: PageHdr) {
		this.page = hdr;
	}

	PrintChar(_v: Int32) {}

	PageCopy(_dst: PageHdr, _src: PageHdr) {}

	PrintFloat(_v: Float32) {}

	InputInt() {
		return 0;
	}

	InputString(_dst: StringHdr) {}

	InputFloat() {
		return 0;
	}

	DataReadInt() {
		return 0;
	}

	DataReadString(_hdr: StringHdr) {}

	DataReadFloat() {
		return 0;
	}

	ShowPic(_page: PageHdr, _res: ResHdr, _dx: Int32, _dy: Int32, _w: Int32, _h: Int32, _x: Int32, _y: Int32, _mode: Int32) {}

	PageFill(_hdr: PageHdr, _x: Int32, _y: Int32, _w: Int32, _h: Int32, _color: Int32) {}

	PagePixel(_hdr: PageHdr, _x: Int32, _y: Int32, _color: Int32) {}

	PageReadPixel(_hdr: PageHdr, _x: Int32, _y: Int32) {
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
