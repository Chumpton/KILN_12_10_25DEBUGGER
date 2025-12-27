
import { GameState, SpellType, Player, AreaEffect, Vector2 } from '../../../types';
import { SpellDefinition } from '../SpellRegistry';
import { SpellCallbacks } from '../SpellBehavior';
import { SpellBehavior } from '../SpellBehavior';

const GRAVITY_WELL_DURATION = 180; // 3 seconds
const PULL_FORCE = 0.05; // Strength of pull
const PULL_RADIUS = 5; // Radius of effect

export const GravityWellBehavior: SpellBehavior = {
    onCast: (state: GameState, config: SpellDefinition, caster: Player, target: Vector2, callbacks: SpellCallbacks) => {
        // Create the Gravity Well Area Effect
        callbacks.createAreaEffect({
            pos: { ...target },
            radius: config.baseStats.aoeRadius || PULL_RADIUS,
            duration: config.baseStats.duration || GRAVITY_WELL_DURATION,
            damage: config.baseStats.baseDamage || 2, // Low constant damage
            tickInterval: 10, // Tick fast for smooth pull
            color: '#8b5cf6', // Violet
            type: 'gravity_well',
            ownerId: caster.id,
            spellType: SpellType.GRAVITY_WELL,
            data: {
                innerRadius: 1,
                pullForce: PULL_FORCE,
                particleTimer: 0
            }
        });

        callbacks.addFloatingText("Gravity Well", target, "#a78bfa");
    },

    onTick: (state: GameState, ae: AreaEffect, callbacks: SpellCallbacks) => {
        // Physics: Pull enemies towards center
        state.enemies.forEach(e => {
            if (e.isDead || e.isPhasing) return;

            const dx = ae.pos.x - e.pos.x;
            const dy = ae.pos.y - e.pos.y;
            const distSq = dx * dx + dy * dy;
            const radiusSq = ae.radius * ae.radius;

            if (distSq <= radiusSq && distSq > 0.1) {
                const dist = Math.sqrt(distSq);

                // Pull force increases as you get closer to center (Gravity style)
                // But cap it to avoid crazy flinging
                const force = (ae.data?.pullForce || PULL_FORCE) * (1 + (ae.radius - dist) / ae.radius);

                e.velocity.x += (dx / dist) * force;
                e.velocity.y += (dy / dist) * force;

                // Apply minor damage occasionally
                if (ae.tickTimer <= 0) {
                    // Damage logic handled by system? Or here?
                    // System handles 'tickInterval' reset, we just check if it triggered.
                    // We doing damage every tick might be too much, but let's assume valid.
                    callbacks.onEnemyHit(e, ae.damage * 0.1); // Small tick damage
                }
            }
        });
    },

    onRender: (ctx: CanvasRenderingContext2D, ae: AreaEffect, x: number, y: number) => {
        // Render the Gravity Well
        const PIXEL_SCALE = 32; // TILE_WIDTH / 2
        const rPx = ae.radius * PIXEL_SCALE;

        const time = performance.now();

        ctx.save();
        ctx.translate(x, y);

        // 1. Accumulation / Event Horizon (Dark Center)
        ctx.beginPath();
        ctx.ellipse(0, 0, rPx * 0.3, rPx * 0.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();

        // 2. Swirling Rings
        ctx.lineWidth = 2;
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const t = (time / 1000 + i * (Math.PI * 2 / ringCount)) % (Math.PI * 2);
            const scale = 0.3 + (Math.sin(t) + 1) * 0.35; // Pulse

            ctx.beginPath();
            ctx.ellipse(0, 0, rPx * scale, rPx * scale * 0.5, time / 1000 + i, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(139, 92, 246, ${1 - scale})`; // Fade out at edge
            ctx.stroke();
        }

        // 3. Suction Particles (Moving inwards)
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const pTime = (time / 1500 + i / particleCount) % 1; // 0..1 loop
            // Particle starts far and moves in
            const dist = (1 - pTime) * rPx;
            const angle = pTime * Math.PI * 4 + (i * 1337); // Spiral in

            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist * 0.5;

            ctx.fillStyle = '#c4b5fd'; // Light violet
            ctx.fillRect(px, py, 2, 2);
        }

        ctx.restore();
    }
};
