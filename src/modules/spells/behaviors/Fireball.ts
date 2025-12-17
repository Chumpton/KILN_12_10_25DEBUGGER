import { SpellBehavior } from '../SpellBehavior';
import { GameState, Player, SpellType, Vector2 } from '../../../types';
import { calculateSpellDamage } from '../../../utils/combat';
import { soundSystem } from '../../../systems/SoundSystem';
import { SPELL_REGISTRY } from '../SpellRegistry';
import { getTileAt } from '../../world/WorldGen';
import { SpellCallbacks } from '../SpellSystem';
import { drawPixelSprite, drawPixelExplosion } from '../../../utils/graphics';
import { toScreen } from '../../../utils/isometric';

export const FIREBALL_BEHAVIOR: SpellBehavior = {
    // onCast Removed: Uses Default SpellSystem Projectile Logic
    // This ensures proper stat scaling, projectile count, and hit detection.

    onHit: (state: GameState, source: any, target: any, callbacks: SpellCallbacks) => {
        try {
            const config = SPELL_REGISTRY[SpellType.FIRE_FIREBALL];
            const damage = source.damage || calculateSpellDamage(state.player, SpellType.FIRE_FIREBALL);

            if (target) {
                // --- ENEMY HIT ---
                const e = target;
                e.hp -= damage;
                const rawColor = config.animation?.primaryColor || 'ff6600';
                const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
                callbacks.addFloatingText(`${Math.round(damage)}`, e.pos, color);
                callbacks.createImpactPuff(e.pos, SpellType.FIRE_FIREBALL);
                soundSystem.playEnemyHit();

                // Ignite Logic
                e.burnTimer = 180; // 3 seconds (60fps * 3)
                e.burnDamage = Math.max(1, damage * 0.1);

                // Visual Impact - Explosion effect on impact
                const boomColor = config.animation?.primaryColor ? (config.animation.primaryColor.startsWith('#') ? config.animation.primaryColor : `#${config.animation.primaryColor}`) : '#ff6600';
                callbacks.createExplosion(e.pos, 1.5, 0, boomColor); // Visual Boom

                // Slight Knockback
                const dx = e.pos.x - source.pos.x;
                const dy = e.pos.y - source.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const force = (source.knockback || 0) + 0.15; // Slight knockback
                    e.velocity.x += (dx / dist) * force;
                    e.velocity.y += (dy / dist) * force;
                }

                // Flash Logic
                e.hitTimer = 5;

                // Talent Scaling
                const igniteRank = state.player.spellTalents.FIRE.ignition;
                if (igniteRank > 0) {
                    e.burnTimer += igniteRank * 25;
                    e.burnDamage += igniteRank;
                }

                // Explosion / Shrapnel
                const shrapnelDmg = (source.damage || 20) * 0.5 + state.player.level; // Use derived damage

                if (source.explosionRadius && source.explosionRadius > 0 && !source.isShrapnel) {
                    callbacks.createExplosion(source.pos, source.explosionRadius, damage, boomColor);
                } else if (state.player.level >= 5 && !source.isShrapnel) {
                    callbacks.createExplosionShrapnel(source.pos, shrapnelDmg);
                }

                if (e.hp <= 0 && e.enemyState !== 'DYING') {
                    e.enemyState = 'DYING';
                    e.deathTimer = 30;
                    callbacks.onEnemyDeath(e);
                }

                // Mark projectile as dead so it disappears on impact
                source.isDead = true;
            } else {
                // --- WALL HIT ---
                callbacks.createImpactPuff(source.pos, SpellType.FIRE);

                // Shrapnel on Wall Hit
                const shrapnelDmg = (source.damage || 20) * 0.5 + state.player.level;
                const boomColor = config.animation?.primaryColor ? (config.animation.primaryColor.startsWith('#') ? config.animation.primaryColor : `#${config.animation.primaryColor}`) : '#ff6600';

                if (source.explosionRadius && source.explosionRadius > 0 && !source.isShrapnel) {
                    callbacks.createExplosion(source.pos, source.explosionRadius, damage, boomColor);
                } else if (state.player.level >= 5 && !source.isShrapnel) {
                    callbacks.createExplosionShrapnel(source.pos, shrapnelDmg);
                }

                // Mark projectile as dead on wall hit too
                source.isDead = true;
            }
        } catch (err) {
            console.error('[Fireball] onHit Crash:', err);
        }
    },
    onRender: (ctx: CanvasRenderingContext2D, p: any, x: number, y: number) => {
        // x, y are the screen coordinates of the projectile (with camera offset) provided by GameCanvas

        // Calculate Camera Offset based on current position and passed screen coordinates
        const pScreenNoOffset = toScreen(p.pos.x, p.pos.y);
        const offsetX = x - pScreenNoOffset.x;
        const offsetY = y - pScreenNoOffset.y;

        // Throttled Log
        // if (Math.random() < 0.01) console.log('[Fireball Render]', { id: p.id, x, y, drawX: x, drawY: y - 35 });

        const drawX = x;
        const drawY = y - 35; // Lift visual to match hand height

        // --- TRAIL UPDATE ---
        // Push current position to trail history
        if (!p.data) p.data = { trail: [] };
        if (!p.data.trail) p.data.trail = [];
        p.data.trail.push({ x: p.pos.x, y: p.pos.y });
        if (p.data.trail.length > 8) p.data.trail.shift();

        // --- TRAIL RENDER ---
        ctx.save();
        p.data.trail.forEach((pos: Vector2, i: number) => {
            const tScreen = toScreen(pos.x, pos.y);
            const tx = tScreen.x + offsetX;
            const ty = tScreen.y + offsetY - 35; // Apply same lift to trail

            const scale = i / p.data.trail.length;

            const jitterX = (Math.random() - 0.5) * 12;
            const jitterY = (Math.random() - 0.5) * 12;

            // Fire Colors: Yellow -> Orange -> Red
            const hue = 30 + (Math.random() * 30); // 30-60 (Orange-Yellow)
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${scale})`;

            ctx.beginPath();
            ctx.arc(tx + jitterX, ty + jitterY, (3 + Math.random() * 2) * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        // --- FIREBALL EFFECT ---
        ctx.save();

        // Draw glowing fireball
        const size = 18 + Math.sin(Date.now() / 80) * 4; // Fast pulse

        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 25;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'; // Red-Orange Base
        ctx.beginPath();
        ctx.arc(drawX, drawY, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core (Yellow/White)
        ctx.shadowColor = '#fcd34d';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(drawX, drawY, size * 0.6, 0, Math.PI * 2);
        ctx.fill();



        ctx.restore();
    }
};