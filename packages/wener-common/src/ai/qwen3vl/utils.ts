// xyxy
type Bbox2d = [number, number, number, number];
// x_center, y_center, z_center, x_size, y_size, z_size, roll, pitch, yaw
type Bbox3d = [number, number, number, number, number, number, number, number, number];
type Dimensions = { width: number; height: number };

/**
 * Convert Qwen3V format bbox (0-1000 range) to absolute pixel coordinates
 * @param dimensions Image dimensions {width, height}
 * @param bbox Bbox in Qwen3V format [x1, y1, x2, y2] where each value is 0-1000
 * @returns Absolute pixel coordinates [x1, y1, x2, y2]
 */
export function fromQwen3VlBbox2d({ width, height }: Dimensions, bbox: Bbox2d): Bbox2d {
	const [x1, y1, x2, y2] = bbox;
	return [
		Math.floor((x1 / 1000) * width),
		Math.floor((y1 / 1000) * height),
		Math.floor((x2 / 1000) * width),
		Math.floor((y2 / 1000) * height),
	];
}

/**
 * Convert absolute pixel coordinates to Qwen3V format bbox (0-1000 range)
 * @param dimensions Image dimensions {width, height}
 * @param bbox Absolute pixel coordinates [x1, y1, x2, y2]
 * @returns Bbox in Qwen3V format [x1, y1, x2, y2] where each value is 0-1000
 */
export function toQwen3VlBbox2d({ width, height }: Dimensions, bbox: Bbox2d): Bbox2d {
	const [x1, y1, x2, y2] = bbox;
	return [
		Math.round((x1 / width) * 1000),
		Math.round((y1 / height) * 1000),
		Math.round((x2 / width) * 1000),
		Math.round((y2 / height) * 1000),
	];
}
