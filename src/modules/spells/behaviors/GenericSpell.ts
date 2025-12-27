import { SpellBehavior } from '../SpellBehavior';
import { GameState, Player, SpellType, Vector2 } from '../../../types';
import { calculateSpellDamage } from '../../../utils/combat';
import { SPELL_REGISTRY } from '../SpellRegistry';
// Fixed Import
import { SpellCallbacks } from '../SpellBehavior';
import { soundSystem } from '../../../systems/SoundSystem';
import { drawPixelSprite } from '../../../utils/graphics';
import { toScreen } from '../../../utils/isometric';

// A fallback behavior for simple projectile spells
export const GENERIC_SPELL_BEHAVIOR: SpellBehavior = {
    // onCast removed to allow fallthrough


    onHit: (state: GameState, source: any, target: any, callbacks: SpellCallbacks) => {
        const config = SPELL_REGISTRY[source.spellType as SpellType];

        if (target) {
            const e = target;
            e.hp -= source.damage;
            const rawIn = config.animation?.primaryColor || 'ffffff';
            const color = rawIn.startsWith('#') ? rawIn : `#${rawIn}`;
            callbacks.addFloatingText(`${Math.round(source.damage)}`, e.pos, color);
            callbacks.createImpactPuff(e.pos, source.spellType);
            soundSystem.playEnemyHit();

            if (config.slowDuration) {
                e.isFrozen = true;
                e.freezeTimer = config.slowDuration;
            }
            if (config.knockbackBase) {
                const dx = e.pos.x - source.pos.x;
                const dy = e.pos.y - source.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                e.velocity.x += (dx / dist) * config.knockbackBase;
                e.velocity.y += (dy / dist) * config.knockbackBase;
            }

            if (e.hp <= 0) {
                e.isDead = true;
                callbacks.onEnemyDeath(e);
            }

            if (!config.pierce || source.hitList.length >= config.pierce) {
                source.isDead = true;
            }
        } else {
            source.isDead = true;
            callbacks.createImpactPuff(source.pos, source.spellType);
        }
    },

    onRender: (ctx: CanvasRenderingContext2D, p: any, x: number, y: number) => {
        const config = SPELL_REGISTRY[p.spellType as SpellType];

        // Generic "Mana Bolt" Sprite
        const boltArt = [
            [0, 1, 2, 1, 0],
            [1, 2, 2, 2, 1],
            [2, 2, 2, 2, 2],
            [1, 2, 2, 2, 1],
            [0, 1, 2, 1, 0]
        ];

        // Color mapping
        const rawP = config?.animation?.primaryColor || 'ffffff';
        const color = rawP.startsWith('#') ? rawP : `#${rawP}`;
        const palette = ['transparent', color, '#ffffff']; // Outer, Core

        ctx.save();
        ctx.translate(x, y - 30); // Use passed screen coords with lift

        // Rotate
        // Rotate (Screen Space)
        const s0 = toScreen(p.pos.x, p.pos.y);
        const s1 = toScreen(p.pos.x + p.velocity.x, p.pos.y + p.velocity.y);
        const screenDx = s1.x - s0.x;
        const screenDy = s1.y - s0.y;
        const angle = Math.atan2(screenDy, screenDx);
        ctx.rotate(angle);

        drawPixelSprite(ctx, 0, 0, boltArt, palette, 3 * (config?.projectileScale || 1));

        ctx.restore();
    }
};