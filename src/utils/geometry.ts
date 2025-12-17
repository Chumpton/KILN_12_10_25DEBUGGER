import { Vector2 } from '../types';

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation?: number; // radians
}

export interface RotatedRect {
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotation?: number;
}

// Test whether a world-space point is inside a possibly-rotated ellipse
export const pointInEllipse = (p: Vector2, e: Ellipse): boolean => {
  const theta = e.rotation || 0;
  const cos = Math.cos(-theta);
  const sin = Math.sin(-theta);

  const dx = p.x - e.cx;
  const dy = p.y - e.cy;

  // Rotate point into ellipse local axes (inverse rotation)
  const xr = dx * cos - dy * sin;
  const yr = dx * sin + dy * cos;

  const tx = xr / e.rx;
  const ty = yr / e.ry;

  return (tx * tx + ty * ty) <= 1;
};

export const pointInRotatedRect = (p: Vector2, r: RotatedRect): boolean => {
  const theta = r.rotation || 0;
  const cos = Math.cos(-theta);
  const sin = Math.sin(-theta);
  const dx = p.x - r.cx;
  const dy = p.y - r.cy;
  // Rotate point into local axes
  const xr = dx * cos - dy * sin;
  const yr = dx * sin + dy * cos;

  return Math.abs(xr) <= r.width / 2 && Math.abs(yr) <= r.height / 2;
};

export default pointInEllipse;
