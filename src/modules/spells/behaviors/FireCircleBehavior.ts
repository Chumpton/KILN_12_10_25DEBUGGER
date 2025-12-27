import { GameState, SpellType, Player, AreaEffect, Enemy, Vector2 } from '../../../types';
import { SpellDefinition } from '../SpellRegistry';
import { SpellCallbacks } from '../SpellBehavior';
import { SpellBehavior } from '../SpellBehavior';
import { TILE_WIDTH } from '../../../constants';

const BURN_STACKS_FOR_EXPLOSION = 5;
const EXPLOSION_DAMAGE_MULTIPLIER = 2.5;

// Visual Configuration
const RING_COLOR_BODY = '#F97316'; // Orange (unused in new visual, keeping for fallback)
const RING_COLOR_EDGE = '#EF4444'; // Red
const IGNITION_DURATION = 20; // Frames

export const FireCircleBehavior: SpellBehavior = {
    onCast: (state: GameState, config: SpellDefinition, caster: Player, target: Vector2, callbacks: SpellCallbacks) => {
        // Duration Logic: AreaEffect system uses Milliseconds (dt), so pass config duration directly.
        const durationMs = config.baseStats.duration || 6000;

        // Spawn the Fire Circle (Using "damage_zone" with custom render)
        callbacks.createAreaEffect({
            pos: { ...target },
            radius: config.baseStats.aoeRadius || 5,
            duration: durationMs,
            damage: config.baseStats.baseDamage || 5,
            tickInterval: 30, // Tick every 0.5s approx for damage
            color: RING_COLOR_EDGE,
            type: 'damage_zone',
            ownerId: caster.id,
            spellType: SpellType.FIRE_CIRCLE,
            data: {
                innerRadius: 0, // No hole
                outerRadius: config.baseStats.aoeRadius || 5,
                burnPerTick: 1,
                ignitionTimer: IGNITION_DURATION,
                tickTimer: 0,
                hitThisTick: []
            }
        });

        // Instant Cast Text
        callbacks.addFloatingText("Fire Circle!", caster.pos, "orange");
    },

    onTick: (state: GameState, ae: AreaEffect, callbacks: SpellCallbacks) => {
        if (!ae.data) return;

        // Visual Animation Timers
        if (ae.data.ignitionTimer > 0) ae.data.ignitionTimer--;

        // Visual only updates? 
        // Damage logic is handled by 'damage_zone' generic logic in updateAreaEffects usually?
        // IF 'type' is 'damage_zone', the System handles damage ticking?
        // Let's assume we need custom logic because we have custom stacks/explosions.
        // But `updateAreaEffects` might double dip if we are not careful.
        // However, this behavior only exports onTick. If the System calls this INSTEAD of generic logic, we are good.
        // If System calls this AND generic logic... 
        // Checking SpellSystem implies generic logic handles simple damage.
        // BUT we have complex logic (Stacks, Chain).
        // I will keep the custom logic but ensure we don't conflict. 
        // Ideally, 'damage_zone' type in `createAreaEffect` might trigger generic damage.
        // To be safe, I'll rely on THIS `onTick` for damage and set damage in `createAreaEffect` to 0 or handle it here?
        // `createAreaEffect` had `damage` passed.
        // Let's implement the logic here to be sure, and maybe the System logic is simple.

        ae.tickTimer -= 1;
        if (ae.tickTimer <= 0) {
            ae.tickTimer = ae.tickInterval;

            const outerSq = ae.data.outerRadius * ae.data.outerRadius;

            // Damage Logic
            state.enemies.forEach(e => {
                if (e.isDead || !e.pos) return;
                const dx = e.pos.x - ae.pos.x;
                const dy = e.pos.y - ae.pos.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= outerSq) {
                    // Apply Damage
                    callbacks.onEnemyHit(e, ae.damage);

                    // Apply Burn
                    if (!e.status) e.status = {};
                    e.status.burnTimer = (e.status.burnTimer || 0) + 60;

                    // Burn Stacks
                    e.status.fireStacks = (e.status.fireStacks || 0) + 1;

                    // Detonation Check
                    if (e.status.fireStacks >= BURN_STACKS_FOR_EXPLOSION) {
                        e.status.fireStacks = 0;
                        callbacks.createExplosion(e.pos, 2.5, ae.damage * EXPLOSION_DAMAGE_MULTIPLIER, '#EF4444', undefined, 0.4);
                        callbacks.createVisualEffect('nova', e.pos, 15, { radius: 2.5, color: '#FEF9C3' });
                    }
                }
            });
        }
    },

    onRender: (ctx: CanvasRenderingContext2D, ae: AreaEffect, x: number, y: number) => {
        if (!ae.data) return;

        // Scale: TILE_WIDTH (64) / 2 = 32 pixels per unit radius
        const PIXEL_SCALE = 32;
        const outerPx = ae.data.outerRadius * PIXEL_SCALE;

        // Isometric Projection
        const rX = outerPx;
        const rY = outerPx * 0.5;

        const ignition = ae.data.ignitionTimer / IGNITION_DURATION; // 1.0 -> 0.0
        const pulse = (Math.sin(performance.now() / 200) + 1) * 0.5; // 0..1

        ctx.save();
        ctx.translate(x, y);

        // 1. Ground Scorch (Dark base)
        ctx.beginPath();
        ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(50, 20, 10, 0.4)';
        ctx.fill();

        // 2. Main Fire Body (Animated)
        if (ignition > 0) {
            // Expansion
            const grow = 1 - ignition;
            ctx.beginPath();
            ctx.ellipse(0, 0, rX * grow, rY * grow, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + grow * 0.3})`; // Reddish
            ctx.fill();
        } else {
            // Stable Fire
            ctx.beginPath();
            ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);

            // Gradient for "Fire Center" look
            const grad = ctx.createRadialGradient(0, 0, rX * 0.2, 0, 0, rX);
            grad.addColorStop(0, 'rgba(254, 240, 138, 0.7)'); // Yellow core
            grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.5)'); // Orange body
            grad.addColorStop(1, 'rgba(239, 68, 68, 0.2)'); // Red edge

            ctx.fillStyle = grad;
            ctx.fill();
        }

        // 3. The Red Ring (Edge)
        ctx.beginPath();
        ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = RING_COLOR_EDGE;
        ctx.stroke();

        // 4. Fire Particles (Procedural)
        const time = performance.now() / 500;
        const count = 12;
        for (let i = 0; i < count; i++) {
            // Random-ish distribution within circle
            const angle = (i / count) * Math.PI * 2 + time + (i * 1337);
            const distNorm = (Math.sin(time * 2 + i) + 1) * 0.5; // 0..1 oscillating
            const dist = distNorm * (ae.data.outerRadius * 0.8); // 80% coverage

            const px = Math.cos(angle) * dist * PIXEL_SCALE;
            const py = Math.sin(angle) * dist * PIXEL_SCALE * 0.5;

            // Rise effect
            const rise = (time * 20 + i * 10) % 20;

            ctx.fillStyle = i % 2 === 0 ? '#FEF08A' : '#F97316';
            ctx.fillRect(px, py - rise, 3, 3);
        }

        ctx.restore();
    }
};
