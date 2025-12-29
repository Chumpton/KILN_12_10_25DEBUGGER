import { TileType } from '../world/TileSystem';
import { WorldObject } from '../../types';

export type MapType = 'HOME' | 'DUNGEON';

export interface SerializedMapData {
    id: string;
    name: string;
    type: MapType;
    tier: number; // 0 for Home
    width: number;
    height: number;

    // Compressed or raw arrays
    tiles: { x: number; y: number; type: TileType; bitmask?: number; variant?: number }[]; // Sparse array for efficiency
    objects: WorldObject[];

    // Metadata
    createdAt: number;
    updatedAt: number;

    // Config
    enemyDensity?: number; // 0-1
    bossId?: string;
}

export const MAP_SIZE_SMALL = 32;
export const MAP_SIZE_MEDIUM = 64;
export const MAP_SIZE_LARGE = 128;
