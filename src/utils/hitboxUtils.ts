import { Enemy, Vector2 } from '../types';
import { toScreen } from './isometric';

/**
 * Rectangle hitbox in screen space
 */
export interface ScreenRect {
    x: number;  // Center X
    y: number;  // Center Y
    w: number;  // Width
    h: number;  // Height
}

/**
 * Calculate detailed hitboxes for an enemy based on their screen position
 * These hitboxes encompass the individual body parts of the enemy sprite
 */
export const calculateEnemyHitboxes = (enemy: Enemy): Record<string, ScreenRect> => {
    const screenPos = toScreen(enemy.pos.x, enemy.pos.y);

    // Hitbox dimensions based on actual enemy sprite size
    // Enemy sprites are approximately 80px tall from head to feet
    const hitboxes: Record<string, ScreenRect> = {};

    // Main body hitbox - encompasses the entire visible sprite
    // This is the primary collision box for player collision
    hitboxes.body = {
        x: screenPos.x,
        y: screenPos.y - 40,  // Center at middle of sprite (80px tall / 2)
        w: 32,                // Full width of sprite
        h: 80                 // Full height from head to feet
    };

    // Head hitbox (top portion)
    hitboxes.head = {
        x: screenPos.x,
        y: screenPos.y - 70,  // Top of sprite
        w: 24,
        h: 24
    };

    // Torso hitbox (middle portion)
    hitboxes.torso = {
        x: screenPos.x,
        y: screenPos.y - 45,  // Middle of sprite
        w: 32,
        h: 35
    };

    // Legs hitbox (bottom portion)
    hitboxes.legs = {
        x: screenPos.x,
        y: screenPos.y - 15,  // Bottom of sprite
        w: 28,
        h: 30
    };

    // Left arm (offset based on facing direction)
    hitboxes.leftArm = {
        x: screenPos.x + (enemy.facingRight ? -14 : 14),
        y: screenPos.y - 50,
        w: 14,
        h: 30
    };

    // Right arm (offset based on facing direction)
    hitboxes.rightArm = {
        x: screenPos.x + (enemy.facingRight ? 14 : -14),
        y: screenPos.y - 50,
        w: 14,
        h: 30
    };

    return hitboxes;
};

/**
 * Check if two rectangles overlap (AABB collision)
 */
export const rectOverlap = (r1: ScreenRect, r2: ScreenRect): boolean => {
    const r1Left = r1.x - r1.w / 2;
    const r1Right = r1.x + r1.w / 2;
    const r1Top = r1.y - r1.h / 2;
    const r1Bottom = r1.y + r1.h / 2;

    const r2Left = r2.x - r2.w / 2;
    const r2Right = r2.x + r2.w / 2;
    const r2Top = r2.y - r2.h / 2;
    const r2Bottom = r2.y + r2.h / 2;

    return !(
        r1Right < r2Left ||
        r1Left > r2Right ||
        r1Bottom < r2Top ||
        r1Top > r2Bottom
    );
};

/**
 * Check if a point overlaps with a rectangle
 */
export const pointInRect = (px: number, py: number, rect: ScreenRect): boolean => {
    const left = rect.x - rect.w / 2;
    const right = rect.x + rect.w / 2;
    const top = rect.y - rect.h / 2;
    const bottom = rect.y + rect.h / 2;

    return px >= left && px <= right && py >= top && py <= bottom;
};

/**
 * Check if any of the enemy's hitboxes overlap with another enemy's hitboxes
 */
export const enemiesCollide = (enemy1: Enemy, enemy2: Enemy): boolean => {
    const hitboxes1 = calculateEnemyHitboxes(enemy1);
    const hitboxes2 = calculateEnemyHitboxes(enemy2);

    // Check all combinations of hitboxes
    for (const part1 in hitboxes1) {
        for (const part2 in hitboxes2) {
            if (rectOverlap(hitboxes1[part1], hitboxes2[part2])) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Check if a projectile (as a rectangle) hits any of the enemy's hitboxes
 */
export const projectileHitsEnemy = (projectileRect: ScreenRect, enemy: Enemy): boolean => {
    const hitboxes = calculateEnemyHitboxes(enemy);

    // Check if projectile overlaps with any body part
    for (const part in hitboxes) {
        if (rectOverlap(projectileRect, hitboxes[part])) {
            return true;
        }
    }

    return false;
};
