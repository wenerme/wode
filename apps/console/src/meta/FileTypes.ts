import { defineFileType } from '@wener/common/meta';

export const TIFFFileType = defineFileType({
  name: 'tiff',
  title: 'TIFF Image',
  description: 'Tagged Image File Format, used for high-quality images',
  types: ['image/tiff'],
  extensions: ['.tiff', '.tif'],
});

export const JPEGFileType = defineFileType({
  name: 'jpeg',
  title: 'JPEG Image',
  description: 'Common lossy image format, widely used for photos',
  types: ['image/jpeg'],
  extensions: ['.jpg', '.jpeg'],
});

export const PNGFileType = defineFileType({
  name: 'png',
  title: 'PNG Image',
  description: 'Lossless image format supporting transparency',
  types: ['image/png'],
  extensions: ['.png'],
});

export const GIFFileType = defineFileType({
  name: 'gif',
  title: 'GIF Image',
  description: 'Graphics Interchange Format, supports simple animation',
  types: ['image/gif'],
  extensions: ['.gif'],
});

export const BMPFileType = defineFileType({
  name: 'bmp',
  title: 'BMP Image',
  description: 'Bitmap image format, often uncompressed',
  types: ['image/bmp'],
  extensions: ['.bmp'],
});

export const WEBPFileType = defineFileType({
  name: 'webp',
  title: 'WebP Image',
  description: 'Modern image format with both lossy and lossless compression',
  types: ['image/webp'],
  extensions: ['.webp'],
});

export const SVGFileType = defineFileType({
  name: 'svg',
  title: 'SVG Vector Image',
  description: 'Scalable Vector Graphics',
  types: ['image/svg+xml'],
  extensions: ['.svg'],
});

export const PDFFileType = defineFileType({
  name: 'pdf',
  title: 'PDF Document',
  description: 'Portable Document Format, widely used for documents',
  types: ['application/pdf'],
  extensions: ['.pdf'],
});

/** DOC (Microsoft Word) */
export const DOCFileType = defineFileType({
  name: 'doc',
  title: 'Word Document (Legacy)',
  description: 'Microsoft Word binary file format (.doc)',
  types: ['application/msword'],
  extensions: ['.doc'],
});

/** DOCX (Microsoft Word, OOXML) */
export const DOCXFileType = defineFileType({
  name: 'docx',
  title: 'Word Document',
  description: 'Microsoft Word OOXML file format (.docx)',
  types: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  extensions: ['.docx'],
});

/** XLS (Microsoft Excel) */
export const XLSFileType = defineFileType({
  name: 'xls',
  title: 'Excel Spreadsheet (Legacy)',
  description: 'Microsoft Excel binary file format (.xls)',
  types: ['application/vnd.ms-excel'],
  extensions: ['.xls'],
});

/** XLSX (Microsoft Excel, OOXML) */
export const XLSXFileType = defineFileType({
  name: 'xlsx',
  title: 'Excel Spreadsheet',
  description: 'Microsoft Excel OOXML file format (.xlsx)',
  types: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  extensions: ['.xlsx'],
});

/** PPT (Microsoft PowerPoint) */
export const PPTFileType = defineFileType({
  name: 'ppt',
  title: 'PowerPoint Presentation (Legacy)',
  description: 'Microsoft PowerPoint binary file format (.ppt)',
  types: ['application/vnd.ms-powerpoint'],
  extensions: ['.ppt'],
});

/** PPTX (Microsoft PowerPoint, OOXML) */
export const PPTXFileType = defineFileType({
  name: 'pptx',
  title: 'PowerPoint Presentation',
  description: 'Microsoft PowerPoint OOXML file format (.pptx)',
  types: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  extensions: ['.pptx'],
});

/** PLAIN TEXT */
export const TXTFileType = defineFileType({
  name: 'txt',
  title: 'Plain Text',
  description: 'Unformatted text file',
  types: ['text/plain'],
  extensions: ['.txt'],
});

/** MARKDOWN */
export const MarkdownFileType = defineFileType({
  name: 'md',
  title: 'Markdown Document',
  description: 'Lightweight markup language for formatting text',
  types: ['text/markdown'],
  extensions: ['.md'],
});

/** JSON */
export const JSONFileType = defineFileType({
  name: 'json',
  title: 'JSON Document',
  description: 'JavaScript Object Notation, structured data format',
  types: ['application/json'],
  extensions: ['.json'],
});

/** YAML */
export const YAMLFileType = defineFileType({
  name: 'yaml',
  title: 'YAML Document',
  description: 'Human-readable data serialization language',
  types: ['application/x-yaml', 'text/yaml'],
  extensions: ['.yaml', '.yml'],
});

/** XML */
export const XMLFileType = defineFileType({
  name: 'xml',
  title: 'XML Document',
  description: 'Extensible Markup Language',
  types: ['application/xml', 'text/xml'],
  extensions: ['.xml'],
});

/** HTML */
export const HTMLFileType = defineFileType({
  name: 'html',
  title: 'HTML Document',
  description: 'HyperText Markup Language, used for web pages',
  types: ['text/html'],
  extensions: ['.html', '.htm'],
});
