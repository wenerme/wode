export type XY = [x: number, y: number];
/**
 * Top Left & Size
 */
export type XYWH = [x: number, y: number, w: number, h: number];
/**
 * Top Left & Bottom Right
 */
export type XYXY = [x1: number, y1: number, x2: number, y2: number];
/**
 * Center coordinate & Size
 *
 * - Yolo
 */
export type CXCYWH = [cx: number, cy: number, w: number, h: number];

type SizeObject = {
  width: number;
  height: number;
};

type XYObject = {
  x: number;
  y: number;
};

type XYSizeObject = XYObject & SizeObject;

/*
https://github.com/devrimcavusoglu/pybboxes
 */

export type Annotation = {
  id: string;
  type?: string;
  label?: string;
  text?: string;
  markdown?: string;
  csv?: string;
  bbox: XYWH;
  confidence?: number;

  annotations?: Annotation[];

  tags?: string[];
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
};
