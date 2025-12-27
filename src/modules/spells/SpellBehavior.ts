import { GameState, Player, Enemy, AreaEffect, Projectile, Vector2, SpellType } from '../../types';
import { SpellDefinition } from './SpellRegistry';

export interface SpellCallbacks {
    addFloatingText: (text: string, pos: Vector2, color: string) => void;
    createExplosion: (pos: Vector2, radius: number, damage: number, color: string, shapeData?: { type: 'RING' | 'CONE', data: any }, knockback?: number) => void;
    createAreaEffect: (config: any) => void;
    createExplosionShrapnel: (pos: Vector2, damage: number) => void;
    createImpactPuff: (pos: Vector2, spellType: SpellType) => void;
    createVisualEffect: (type: 'nova' | 'particle' | 'text' | 'ring' | 'surge' | 'shatter' | 'sprite' | 'lightning_chain', pos: Vector2, duration: number, data?: any) => void;
    checkLevelUp: (p: Player) => void;
    onEnemyDeath: (e: Enemy) => void;
    onEnemyHit: (e: Enemy, damage: number, effect?: 'freeze' | 'burn' | 'shock') => void;
    getProjectileOrigin: (entity: any) => Vector2 | null;
}

export interface SpellBehavior {
    // Called when the spell cast is successfully initiated
    // Return false to allow systemic fallthrough (for hybrid behaviors)
    onCast?: (state: GameState, spell: SpellDefinition, player: Player, target: Vector2, callbacks: SpellCallbacks) => boolean | void;

    // Called every frame for AreaEffects
    onTick?: (state: GameState, effect: AreaEffect, callbacks: SpellCallbacks) => void;

    // Called when a Projectile or AreaEffect hits an enemy
    onHit?: (state: GameState, source: AreaEffect | Projectile, target: Enemy | null, callbacks: SpellCallbacks) => void;

    // Called every frame for Projectiles (Optional)
    onUpdate?: (state: GameState, entity: any, callbacks: SpellCallbacks) => void;

    // Called during rendering (Optional - override default rendering)
    onRender?: (ctx: CanvasRenderingContext2D, effect: AreaEffect | Projectile, x: number, y: number) => void;
}
