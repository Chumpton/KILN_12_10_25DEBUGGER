import { SerializedMapData, MapType } from './MapTypes';
import { SAVED_TILE_MAP, SAVED_WORLD_OBJECTS } from '../../data/WorldObjects';

const STORAGE_KEY_PREFIX = 'kiln_map_';
const INDEX_KEY = 'kiln_map_index';

export class MapStorage {
    // Get list of all saved maps
    static getMapIndex(): { id: string; name: string; type: MapType }[] {
        try {
            const raw = localStorage.getItem(INDEX_KEY);
            if (!raw) return [];
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data.filter(d => d && d.id && d.name) : [];
        } catch (e) {
            console.error('Failed to load map index', e);
            return [];
        }
    }

    static saveMap(map: SerializedMapData): boolean {
        try {
            // 1. Save Map Data
            localStorage.setItem(STORAGE_KEY_PREFIX + map.id, JSON.stringify(map));

            // 2. Update Index
            const index = this.getMapIndex();
            const existingEntry = index.findIndex(i => i.id === map.id);

            const entry = { id: map.id, name: map.name, type: map.type };

            if (existingEntry >= 0) {
                index[existingEntry] = entry;
            } else {
                index.push(entry);
            }

            localStorage.setItem(INDEX_KEY, JSON.stringify(index));
            return true;
        } catch (e) {
            console.error('Failed to save map', e);
            return false;
        }
    }

    static loadMap(id: string): SerializedMapData | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PREFIX + id);
            if (raw) return JSON.parse(raw);

            // Fallback for Home Base if not in LS (e.g. save failed or cleared)
            if (id === 'home_base_default') {
                console.warn("Home Base not found in LS, using hardcoded fallback.");
                return {
                    id: 'home_base_default',
                    name: 'Home Base',
                    type: 'HOME',
                    tier: 0,
                    width: 64,
                    height: 64,
                    tiles: SAVED_TILE_MAP,
                    objects: SAVED_WORLD_OBJECTS,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
            }

            return null;
        } catch (e) {
            console.error('Failed to load map ' + id, e);
            // Even on error, try fallback for home
            if (id === 'home_base_default') {
                try {
                    return {
                        id: 'home_base_default',
                        name: 'Home Base',
                        type: 'HOME',
                        tier: 0,
                        width: 64,
                        height: 64,
                        tiles: SAVED_TILE_MAP,
                        objects: SAVED_WORLD_OBJECTS,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                } catch (err) {
                    console.error("Critical: Failed to load hardcoded default map", err);
                }
            }
            return null;
        }
    }

    static deleteMap(id: string) {
        try {
            localStorage.removeItem(STORAGE_KEY_PREFIX + id);
            const index = this.getMapIndex().filter(i => i.id !== id);
            localStorage.setItem(INDEX_KEY, JSON.stringify(index));
        } catch (e) {
            console.error('Failed to delete map', e);
        }
    }

    // Initialize Default Maps if empty or home is empty
    static initDefaults() {
        // console.log("InitDefaults: SAVED_TILE_MAP type:", typeof SAVED_TILE_MAP);
        // console.log("InitDefaults: SAVED_WORLD_OBJECTS type:", typeof SAVED_WORLD_OBJECTS);

        const index = this.getMapIndex();
        const homeExists = index.find(m => m.id === 'home_base_default');

        // Check if we need to hydrate or overwrite empty home
        let shouldCreate = false;
        if (!homeExists) {
            shouldCreate = true;
        } else {
            // If it exists, let's check if it's the "bad" empty one we made earlier.
            // We can check the actual map content.
            const map = this.loadMap('home_base_default');
            if (map && map.tiles.length === 0) {
                shouldCreate = true;
                console.log("Overwriting empty Home Base with actual defaults.");
            }
        }

        if (shouldCreate) {
            console.log('Generating Default Home Base from WorldObjects...');
            // Create a basic Home Base
            const homeBase: SerializedMapData = {
                id: 'home_base_default',
                name: 'Home Base',
                type: 'HOME',
                tier: 0,
                width: 64,
                height: 64,
                tiles: SAVED_TILE_MAP, // Now matches interface
                objects: SAVED_WORLD_OBJECTS,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.saveMap(homeBase);
        }
    }
}
