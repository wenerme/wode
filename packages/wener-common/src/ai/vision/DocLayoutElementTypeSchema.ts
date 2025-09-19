import { z } from 'zod';

// based on DocLayout-YOLO

export const DocLayoutElementType = Object.freeze({
	Title: 'Title',
	PlainText: 'PlainText',
	Abandon: 'Abandon',
	Figure: 'Figure',
	FigureCaption: 'FigureCaption',
	Table: 'Table',
	TableCaption: 'TableCaption',
	TableFootnote: 'TableFootnote',
	IsolateFormula: 'IsolateFormula',
	FormulaCaption: 'FormulaCaption',
});
export type DocLayoutElementType = (typeof DocLayoutElementType)[keyof typeof DocLayoutElementType];

export const DocLayoutElementTypeSchema = z.union([
	z.literal(DocLayoutElementType.Title).describe('标题'),
	z.literal(DocLayoutElementType.PlainText).describe('纯文本'),
	z.literal(DocLayoutElementType.Abandon).describe('废弃'),
	z.literal(DocLayoutElementType.Figure).describe('图片'),
	z.literal(DocLayoutElementType.FigureCaption).describe('图片说明'),
	z.literal(DocLayoutElementType.Table).describe('表格'),
	z.literal(DocLayoutElementType.TableCaption).describe('表格标题'),
	z.literal(DocLayoutElementType.TableFootnote).describe('表格脚注'),
	z.literal(DocLayoutElementType.IsolateFormula).describe('独立公式'),
	z.literal(DocLayoutElementType.FormulaCaption).describe('公式说明'),
]);
