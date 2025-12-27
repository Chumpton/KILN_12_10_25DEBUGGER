import { SpellDefinition } from '../../../modules/spells/SpellRegistry';

/**
 * Unified editing session state for Spell Studio
 * This is the single source of truth for all editing operations
 */
export interface SpellEditorSession {
    // Core spell being edited
    spell: SpellDefinition;

    // Rig configuration
    rig: RigEditorState;

    // Timeline state
    timeline: TimelineState;

    // Canvas visualization state
    canvas: CanvasState;

    // IK system state
    ik: IKState;
}

export interface RigEditorState {
    rigKey: string;
    rigData: any; // TODO: Type this properly from EntityRigDefinitions
    selectedPart: string;
}

export interface TimelineState {
    currentTimeMs: number;
    totalDurationMs: number;
    isPlaying: boolean;
    zoom: number;
    scrollX: number;
    selectedAnim: string; // The animation clip ID being previewed/edited
}

export interface CanvasState {
    zoom: number;
    pan: { x: number; y: number };
    aimAngle: number;

    // Visualization toggles
    showGrid: boolean;
    showBoneDebug: boolean;
    showHitboxes: boolean;
    showDummyEnemies: boolean;
    showOnionSkin: boolean;
    previewPath: boolean;
}

export interface IKState {
    enabled: boolean;
    chain: 'LEFT' | 'RIGHT';
    target: { x: number; y: number };
}

/**
 * Projectile instance for preview/simulation
 */
export interface ProjectileInstance {
    id: number;
    type: string;
    pos: { x: number; y: number };
    vel: { x: number; y: number };
    gravity: number;
    life: number;
}

/**
 * Transform data for a single bone/part
 */
export interface PartTransform {
    x: number;
    y: number;
    rotation: number;
    scaleX?: number;
    scaleY?: number;
}

/**
 * Complete rig transform state (all parts)
 */
export type RigTransforms = Record<string, PartTransform>;
