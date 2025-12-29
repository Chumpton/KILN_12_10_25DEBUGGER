import { SerializedMapData } from '../maps/MapTypes';
import { TemplateData, WorldObject } from '../dev/WorldEditorTypes';
import { Noise } from '../../utils/noise';
import { TileType } from '../world/TileSystem';

export interface BiomeConfig {
    type: string;
    baseTile: TileType;
    templates: {
        templateId: string;
        weight: number; // For random selection
        minNoise: number;
        maxNoise: number;
        density: number; // 0-1 chance to place if noise matches
    }[];
}

export interface GenerationConfig {
    seed: number;
    width: number;
    height: number;
    biomes: BiomeConfig[];
    availableTemplates: TemplateData[];
}

export class WorldGenerator {
    static generateMap(config: GenerationConfig): SerializedMapData {
        const { seed, width, height, biomes, availableTemplates } = config;

        const noise = new Noise(seed);
        const tiles: { x: number; y: number; type: TileType }[] = [];
        const objects: WorldObject[] = [];

        // 1. Initialize Base & Object Grid Tracing to prevent overlapping
        // Simple 2D string set for occupied positions? 
        // Or just let them overlap and rely on Z-index?
        // User said "robust". Overlapping large templates might look chaotic.
        // Let's track occupied tiles for OBJECTS primarily. 
        // Tiles can be overwritten (terrain blending).
        const occupied = new Set<string>();

        // Default to first biome as global base for now
        // TODO: Multi-biome support via noise maps
        const primaryBiome = biomes[0];

        // Fill Base Terrain
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                tiles.push({ x, y, type: primaryBiome.baseTile });
            }
        }

        // 2. Sample Noise and Place Templates
        // Step size: To avoid checking every single tile for a 10x10 template,
        // we could iterate every N tiles?
        // But natural placement allows any coord.
        // Let's iterate every 4 tiles (typical template size?) or 1 tile but low density.

        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                // Noise Sample (Scale coords down for broader features)
                const n = (noise.noise2D(x * 0.05, y * 0.05) + 1) / 2; // 0..1

                // Check Biome Rules
                // For each rule in biome
                for (const rule of primaryBiome.templates) {
                    if (n >= rule.minNoise && n <= rule.maxNoise) {
                        if (Math.random() < rule.density) {
                            // Place this template!
                            const tmpl = availableTemplates.find(t => t.id === rule.templateId);
                            if (tmpl) {
                                this.placeTemplate(tmpl, x, y, tiles, objects, occupied);
                            }
                        }
                    }
                }
            }
        }

        return {
            id: `gen_${Date.now()}`,
            name: `Generated World ${seed}`,
            type: 'DUNGEON',
            tier: 1,
            width,
            height,
            tiles,
            objects,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    private static placeTemplate(
        tmpl: TemplateData,
        startX: number,
        startY: number,
        tiles: { x: number; y: number; type: TileType }[],
        objects: WorldObject[],
        occupied: Set<string>
    ) {
        // Stamp Tiles (Overwrite existing in array? Or append?)
        // TileSystem importData overwrites. So appending is fine if order matters.
        // Ideally we update the existing entry in `tiles` array to keep it clean.
        // Use a Map for O(1) during generation?
        // Optimization: `tiles` as Map<string, TileDef>. For now, linear push is okay if TileSystem handles duplicates.
        // But duplications bloom memory.
        // Let's assume TileSystem handles it or we fix it.
        // Actually, let's just push. TileSystem.importData just iterates.

        tmpl.tiles.forEach(t => {
            // We could filter out existing tiles at this coord if we wanted to be strict
            // But simple append works for TileSystem
            tiles.push({
                x: startX + t.relX,
                y: startY + t.relY,
                type: t.type
            });
        });

        // Stamp Objects
        tmpl.objects.forEach(obj => {
            const worldX = startX + obj.relX;
            const worldY = startY + obj.relY;
            const key = `${Math.floor(worldX)},${Math.floor(worldY)}`;

            // Basic conflict check?
            if (!occupied.has(key)) {
                // Clone object
                const newObj: WorldObject = {
                    ...obj.data,
                    id: `gen_obj_${Date.now()}_${Math.random()}`,
                    pos: { x: worldX, y: worldY },
                    // Recalculate Z?
                    zIndex: Math.floor(worldY * 100) + (obj.data.zIndex - Math.floor(obj.data.pos.y * 100))
                };
                objects.push(newObj);
                occupied.add(key);
            }
        });
    }
}
