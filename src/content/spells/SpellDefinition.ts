import { SpellType } from '../../types';

export type CastAnimationType = 'punch' | 'lift' | 'channel' | 'swing' | 'thrust';

export interface SpellDef {
    id: SpellType;
    name: string;
    description?: string;

    // Visuals
    emoji: string;
    icon?: string;
    color: string;
    iconColors: string[]; // Gradient colors [Start, End]
    rimColor: string; // Metallic Rim Color
    projectileScale: number; // Multiplier relative to ~32px base

    // Categorization
    category: string; // Fire, Ice, Lightning, Earth, Wind, Arcane, Utility, Weapon
    tier: number; // 1-5 (Sort Order)

    // Animation
    castType: CastAnimationType;

    // Logic / Stats
    baseDamage: number;
    damageVariance: number;
    cooldown: number; // Base frames at 25fps
    cost: number;
    castTime: number; // Frames

    // Physics
    baseSpeed: number;
    speedPerLevel: number;
    hitboxSize: number; // Radius of collision or Range for melee

    // Mechanics
    knockbackBase: number;
    knockbackPerLevel: number;

    // Specifics (Optional)
    radius?: number;
    radiusPerLevel?: number;
    slowDuration?: number;
    chainCount?: number;
    chainRange?: number;
    shrapnelCount?: number;
    shrapnelDamage?: number;
    buffDuration?: number;
    shape?: 'cone' | 'circle'; // New property for melee
    arcAngle?: number; // Degrees for cone
    bounces?: number; // Rolling Magma
    maxBounces?: number; // Rolling Magma
    pierce?: number; // Number of enemies to pierce
    chains?: number; // Lightning chains
    width?: number; // Wall dimensions
    height?: number;
    duration?: number;
    explosionRadius?: number;
}
