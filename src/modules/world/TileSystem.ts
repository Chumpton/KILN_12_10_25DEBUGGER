export type TileType = 'grass' | 'grass_2' | 'grass_4x4' | 'grass_4x4_2' | 'grass_4x4_3' | 'grass_6x6' | 'dirt' | 'dirt_4x4' | 'dirt_1x1' | 'stone' | 'water' | 'none';

interface TileDef {
    id: TileType;
    baseTexture: string;
    // For now we just use a base texture, but this structure supports expanding to 47-tile rulesets
    // by adding a mapping of bitmask -> texture path
    connectedTextures?: Record<number, string>;
    connectsTo?: TileType[]; // List of types this tile connects to (e.g. grass connects to grass)
}

export interface TileInstance {
    x: number;
    y: number;
    type: TileType;
    bitmask: number; // calculated neighbor mask (0-255 for 8-bit, or up to 47 rules)
    variant: number; // 0-3 for random variations
}

export class TileSystem {
    private tiles: Map<string, TileInstance> = new Map();
    private registry: Map<TileType, TileDef> = new Map();

    constructor() {
        // Register default tiles
        this.registerTile('grass', 'world_edit/tile_custom_grass.png'); // Using our new test tile
        this.registerTile('grass_2', 'world_edit/tile_grass_2.png'); // New Grass Variant
        this.registerTile('grass_4x4', 'world_edit/Grass42.png'); // 4x4 Grass Variant (Updated to Grass42)
        this.registerTile('grass_4x4_2', 'world_edit/tile_grass_4x4_2.png'); // 4x4 Grass Variant 2
        this.registerTile('grass_4x4_3', 'world_edit/grass43.png'); // 4x4 Grass Variant 3
        this.registerTile('grass_6x6', 'world_edit/grass_6x6.png'); // 6x6 Grass Variant
        this.registerTile('dirt', 'world_edit/tile_dirt.png');
        this.registerTile('dirt_4x4', 'world_edit/dirt 4x4.png'); // New Dirt 4x4
        this.registerTile('dirt_1x1', 'world_edit/Dirt1x1.png'); // New Dirt 1x1
        this.registerTile('stone', 'world_edit/rock_large.png'); // Placeholder
    }

    registerTile(id: TileType, baseTexture: string) {
        this.registry.set(id, { id, baseTexture, connectsTo: [id] });
    }

    getTile(x: number, y: number): TileInstance | undefined {
        return this.tiles.get(`${x},${y}`);
    }

    setTile(x: number, y: number, type: TileType) {
        const key = `${x},${y}`;

        if (type === 'none') {
            this.tiles.delete(key);
        } else {
            const tile: TileInstance = {
                x,
                y,
                type,
                bitmask: 0,
                variant: Math.floor(Math.random() * 4)
            };
            this.tiles.set(key, tile);
        }

        // Update this tile and neighbors
        this.updateBitmask(x, y);
        this.updateNeighbors(x, y);
    }

    // Update neighbors' bitmasks when a tile changes
    private updateNeighbors(x: number, y: number) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                this.updateBitmask(x + dx, y + dy);
            }
        }
    }

    // Calculate 8-bit mask (North, NE, E, SE, S, SW, W, NW)
    // 1 2 4
    // 128 X 8
    // 64 32 16
    private updateBitmask(x: number, y: number) {
        const tile = this.getTile(x, y);
        if (!tile) return;

        let mask = 0;
        const def = this.registry.get(tile.type);
        if (!def) return;

        const check = (dx: number, dy: number, value: number) => {
            const neighbor = this.getTile(x + dx, y + dy);
            // Connect if neighbor exists and is same type (or in connectsTo list)
            if (neighbor && (neighbor.type === tile.type || def.connectsTo?.includes(neighbor.type))) {
                mask |= value;
            }
        };

        check(0, -1, 1);   // N
        check(1, -1, 2);   // NE
        check(1, 0, 4);    // E
        check(1, 1, 8);    // SE
        check(0, 1, 16);   // S
        check(-1, 1, 32);  // SW
        check(-1, 0, 64);  // W
        check(-1, -1, 128);// NW

        tile.bitmask = mask;
    }

    getTexture(tile: TileInstance): string {
        const def = this.registry.get(tile.type);
        if (!def) return '';

        // Future: Check def.connectedTextures[tile.bitmask]
        // For now, return base
        return def.baseTexture;
    }

    exportData(): any[] {
        return Array.from(this.tiles.values());
    }

    importData(data: any[]) {
        this.tiles.clear();
        data.forEach(t => {
            this.tiles.set(`${t.x},${t.y}`, t);
        });
        // Re-calculate all bitmasks to be safe
        this.tiles.forEach(t => this.updateBitmask(t.x, t.y));
    }
}

export const tileSystem = new TileSystem();
