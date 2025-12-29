export type WorldEditorMode = 'paint' | 'select' | 'paste';

import { TileType } from '../world/TileSystem';
import { WorldObject } from '../../types';

export interface TemplateData {
    id: string;
    name: string;
    width: number;
    height: number;
    tiles: { relX: number; relY: number; type: TileType; bitmask?: number; variant?: number }[];
    objects: { relX: number; relY: number; data: WorldObject }[];
}

export interface SelectionBox {
    start: { x: number; y: number };
    end: { x: number; y: number };
}
