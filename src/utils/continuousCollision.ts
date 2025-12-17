import { Vector2 } from '../types';
import { ScreenRect } from './hitboxUtils';

/**
 * Check if a line segment intersects with a rectangle
 * Uses the Liang-Barsky algorithm for line-rectangle intersection
 */
export const lineIntersectsRect = (
    x1: number, y1: number,  // Line start
    x2: number, y2: number,  // Line end
    rect: ScreenRect
): boolean => {
    const left = rect.x - rect.w / 2;
    const right = rect.x + rect.w / 2;
    const top = rect.y - rect.h / 2;
    const bottom = rect.y + rect.h / 2;

    // Check if either endpoint is inside the rectangle
    if ((x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
        (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)) {
        return true;
    }

    // Check if line intersects any of the four edges
    // Top edge
    if (lineIntersectsLine(x1, y1, x2, y2, left, top, right, top)) return true;
    // Bottom edge
    if (lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom)) return true;
    // Left edge
    if (lineIntersectsLine(x1, y1, x2, y2, left, top, left, bottom)) return true;
    // Right edge
    if (lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom)) return true;

    return false;
};

/**
 * Check if two line segments intersect
 */
const lineIntersectsLine = (
    x1: number, y1: number, x2: number, y2: number,  // Line 1
    x3: number, y3: number, x4: number, y4: number   // Line 2
): boolean => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (Math.abs(denom) < 0.0001) {
        // Lines are parallel
        return false;
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
};

/**
 * Check if a moving rectangle (swept) intersects with a stationary rectangle
 * This prevents tunneling by checking the entire path the projectile traveled
 */
export const sweptRectIntersectsRect = (
    movingRect: ScreenRect,
    prevX: number,
    prevY: number,
    currentX: number,
    currentY: number,
    staticRect: ScreenRect
): boolean => {
    // First check if current position overlaps
    const currentOverlap = !(
        (currentX + movingRect.w / 2) < (staticRect.x - staticRect.w / 2) ||
        (currentX - movingRect.w / 2) > (staticRect.x + staticRect.w / 2) ||
        (currentY + movingRect.h / 2) < (staticRect.y - staticRect.h / 2) ||
        (currentY - movingRect.h / 2) > (staticRect.y + staticRect.h / 2)
    );

    if (currentOverlap) return true;

    // Check if the path traveled intersects the rectangle
    // We check the center line of movement
    return lineIntersectsRect(prevX, prevY, currentX, currentY, staticRect);
};
