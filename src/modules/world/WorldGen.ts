
import { ROAD_COLORS, FOLIAGE_VARIANTS, GROUND_COLORS, HEARTHSTONE_POS, SAFE_ZONE_RADIUS, HOUSE_POS, HOUSE_RADIUS } from '../../constants';

// Simple deterministic pseudo-random number generator
export function pseudoRandom(x: number, y: number): number {
    const vector = { x: x + 0.123, y: y + 0.456 };
    let n = Math.sin(vector.x * 12.9898 + vector.y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

// 2D Noise function for larger features (like road paths)
function noise(x: number, y: number): number {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = x - i;
    const v = y - j;

    const n00 = pseudoRandom(i, j);
    const n01 = pseudoRandom(i, j + 1);
    const n10 = pseudoRandom(i + 1, j);
    const n11 = pseudoRandom(i + 1, j + 1);

    const nx0 = n00 * (1 - u) + n10 * u;
    const nx1 = n01 * (1 - u) + n11 * u;

    return nx0 * (1 - v) + nx1 * v;
}

export interface TileData {
    x: number;
    y: number;
    isRoad: boolean;
    roadColor?: string;
    groundColor: string;
    hasTree: boolean;
    treeVariant: string; // Emoji
    treeScale: number;
    hasFoliage: boolean;
    foliageVariant: string;
    detailType?: string;
}

// Simple Cache to prevent object allocation churn
const tileCache = new Map<string, TileData>();
const CACHE_SIZE_LIMIT = 10000;

export const getTileAt = (x: number, y: number): TileData => {
    const key = `${x},${y}`;
    if (tileCache.has(key)) return tileCache.get(key)!;

    // ... generation logic ...

    // Road Generation
    const scale = 0.08;
    const n = Math.sin(x * scale) + Math.cos(y * scale);
    const isRoad = Math.abs(n) < 0.15; // Thin threshold for roads

    let roadColor = undefined;
    if (isRoad) {
        const regionNoise = noise(x * 0.02, y * 0.02);
        const colorIdx = Math.floor(regionNoise * ROAD_COLORS.length);
        roadColor = ROAD_COLORS[Math.min(colorIdx, ROAD_COLORS.length - 1)];
    }

    // Ground Color Variation (Noise)
    const groundNoise = pseudoRandom(x * 0.1, y * 0.1);

    // Real code:
    const gIdxSafe = Math.floor(groundNoise * GROUND_COLORS.length);
    const groundColorSafe = GROUND_COLORS[gIdxSafe] || GROUND_COLORS[0];

    // TREE GENERATION (Grid Based for Spacing)
    // We divide the world into chunks of 5x5.
    // In each chunk, we pick ONE tile to have a tree.
    // This guarantees trees are roughly spaced out by at least a few tiles.
    const GRID_SIZE = 5;
    const chunkX = Math.floor(x / GRID_SIZE);
    const chunkY = Math.floor(y / GRID_SIZE);

    // Hash the chunk coordinates to get a deterministic random position within the chunk
    const chunkHash = pseudoRandom(chunkX, chunkY);
    const offsetX = Math.floor(chunkHash * GRID_SIZE);
    // Use a slightly different seed for Y
    const chunkHashY = pseudoRandom(chunkX + 123, chunkY + 456);
    const offsetY = Math.floor(chunkHashY * GRID_SIZE);

    const targetX = chunkX * GRID_SIZE + offsetX;
    const targetY = chunkY * GRID_SIZE + offsetY;

    const isTargetTile = x === targetX && y === targetY;

    // Tree variant based on tile coord
    const treeVariant = pseudoRandom(x, y) > 0.5 ? '🌲' : '🌳';

    // "Every 5th Tree" Logic
    // We use a deterministic hash of the chunk coordinates to decide size.
    // Using primes 17 and 13 to scatter the pattern.
    // (A + B) % 5 === 0 happens roughly 1 in 5 times.
    const treeScale = ((Math.abs(chunkX * 17 + chunkY * 13) % 5) === 0) ? 3.5 : 2.0;

    // Density check: 
    // Was ~35% (threshold 0.65). 
    // User requested reducing by half -> Target ~17%.
    const treeDensityCheck = pseudoRandom(chunkX * 0.7, chunkY * 1.3);
    const shouldSpawnChunkTree = treeDensityCheck > 0.82; // ~18% chance

    // Check House Zone
    const distToHouse = Math.sqrt(Math.pow(x - HOUSE_POS.x, 2) + Math.pow(y - HOUSE_POS.y, 2));
    const inHouseZone = distToHouse < HOUSE_RADIUS;

    // Trees cannot spawn on roads, in safe zone, or in house
    // const hasTree = isTargetTile && !isRoad && shouldSpawnChunkTree && !inSafeZone && !inHouseZone;
    const hasTree = false; // DISABLED

    // FOLIAGE & DETAILS GENERATION
    let hasFoliage = false;
    let foliageVariant = ''; // Emoji or Key
    let detailType = 'none'; // 'stone', 'puddle', 'none'
    let swayFactor = 1.0;

    if (!isRoad && !hasTree && !inHouseZone) {

        let shouldSpawnFoliage = false;

        // FOLIAGE CLUSTERING (3x3 Grid)
        // Only allow foliage in 1-3's, ~3 tiles apart
        const FOL_GRID = 3;
        const fChunkX = Math.floor(x / FOL_GRID);
        const fChunkY = Math.floor(y / FOL_GRID);
        const fHash = pseudoRandom(fChunkX, fChunkY);

        // 40% chance for a chunk to have a cluster
        if (fHash > 0.6) {
            const clusterSize = 1 + Math.floor((fHash * 10) % 3); // 1-3 items

            // Pick positions for this chunk
            for (let i = 0; i < clusterSize; i++) {
                // Different offsets for each item in cluster
                // Using primes to scatter offsets within the 3x3 grid
                const ox = Math.floor(pseudoRandom(fChunkX + i * 3.3, fChunkY + i * 7.7) * FOL_GRID);
                const oy = Math.floor(pseudoRandom(fChunkX - i * 4.1, fChunkY - i * 2.2) * FOL_GRID);

                const targetFX = fChunkX * FOL_GRID + ox;
                const targetFY = fChunkY * FOL_GRID + oy;

                if (x === targetFX && y === targetFY) {
                    shouldSpawnFoliage = true;
                    break;
                }
            }
        }

        const rng = pseudoRandom(x * 1.5, y * 1.5);

        // Stones (Rare) - 1%
        if (rng < 0.01) {
            detailType = 'stone';
            swayFactor = 0;
        }
        // Puddles (Uncommon) - 1%
        else if (rng < 0.02) {
            detailType = 'puddle';
            swayFactor = 0;
        }
        // Foliage Cluster
        else if (shouldSpawnFoliage) {
            hasFoliage = true;
            const typeRng = pseudoRandom(x, y);

            if (typeRng < 0.33) {
                foliageVariant = '☘️'; // Clover
                swayFactor = 0.5;
            } else if (typeRng < 0.66) {
                foliageVariant = '🌾'; // Grass
                swayFactor = 1.2;
            } else {
                foliageVariant = '🌿'; // Fern
                swayFactor = 1.0;
            }
        }
    }

    const data: TileData = {
        x,
        y,
        isRoad,
        roadColor,
        groundColor: groundColorSafe,
        hasTree,
        treeVariant,
        treeScale: hasTree ? treeScale : 1.0,
        hasFoliage,
        foliageVariant,
        detailType
    };

    if (tileCache.size > CACHE_SIZE_LIMIT) {
        tileCache.clear();
    }
    tileCache.set(key, data);
    return data;
};
