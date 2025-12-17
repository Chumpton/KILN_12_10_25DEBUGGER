/**
 * Pure trajectory mathematics for spell projectiles
 * All calculations in rig space (no zoom/pan transformations)
 */

export interface TrajectoryPoint {
    x: number;
    y: number;
}

export interface TrajectoryParams {
    startPos: { x: number; y: number };
    angle: number;
    speed: number;
    gravity: number;
    maxSteps?: number;
}

/**
 * Calculate projectile trajectory path
 * Returns array of points in rig space
 */
export function calculateTrajectory(params: TrajectoryParams): TrajectoryPoint[] {
    const { startPos, angle, speed, gravity, maxSteps = 30 } = params;

    const points: TrajectoryPoint[] = [];
    let px = startPos.x;
    let py = startPos.y;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;

    points.push({ x: px, y: py });

    for (let i = 0; i < maxSteps; i++) {
        px += vx;
        py += vy;
        vy += gravity;
        points.push({ x: px, y: py });
    }

    return points;
}

/**
 * Calculate projectile position at specific time
 */
export function calculateProjectilePosition(
    startPos: { x: number; y: number },
    angle: number,
    speed: number,
    gravity: number,
    timeMs: number
): TrajectoryPoint {
    const t = timeMs / 16.67; // Convert to frames (assuming 60fps)
    const vx = Math.cos(angle) * speed;
    const vy0 = Math.sin(angle) * speed;

    return {
        x: startPos.x + vx * t,
        y: startPos.y + vy0 * t + 0.5 * gravity * t * t
    };
}

/**
 * Calculate spawn position with offset
 */
export function calculateSpawnPosition(
    handPos: { x: number; y: number },
    spawnOffset: { x: number; y: number }
): TrajectoryPoint {
    return {
        x: handPos.x + spawnOffset.x,
        y: handPos.y + spawnOffset.y
    };
}

/**
 * Calculate distance between two points
 */
export function distance(p1: TrajectoryPoint, p2: TrajectoryPoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if point is within radius of target
 */
export function isWithinRadius(
    point: TrajectoryPoint,
    target: TrajectoryPoint,
    radius: number
): boolean {
    return distance(point, target) <= radius;
}
