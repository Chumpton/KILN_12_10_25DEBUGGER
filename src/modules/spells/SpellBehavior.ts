import { GameState, Player, Enemy, AreaEffect, Projectile, Vector2 } from '../../types';
import { SpellCallbacks } from './SpellSystem';

import { SpellDefinition } from './SpellRegistry';

export interface SpellBehavior {
    // Called when the spell cast is successfully initiated
    onCast?: (state: GameState, spell: SpellDefinition, player: Player, target: Vector2, callbacks: SpellCallbacks) => void;

    // Called every frame for AreaEffects
    onTick?: (state: GameState, effect: AreaEffect, callbacks: SpellCallbacks) => void;

    // Called when a Projectile or AreaEffect hits an enemy
    onHit?: (state: GameState, source: AreaEffect | Projectile, target: Enemy | null, callbacks: SpellCallbacks) => void;

    // Called every frame for Projectiles (Optional)
    onUpdate?: (state: GameState, entity: any, callbacks: SpellCallbacks) => void;

    // Called during rendering (Optional - override default rendering)
    onRender?: (ctx: CanvasRenderingContext2D, effect: AreaEffect | Projectile, x: number, y: number) => void;
}
