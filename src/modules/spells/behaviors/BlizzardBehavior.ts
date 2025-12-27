
import { GameState, SpellType, Player, AreaEffect, Vector2 } from '../../../types';
import { SpellDefinition } from '../SpellRegistry';
import { SpellCallbacks, SpellBehavior } from '../SpellBehavior';

const BLIZZARD_DURATION = 360; // 6 seconds
const BASE_RADIUS = 3.5;
const RADIUS_PER_LEVEL = 0.5;

export const BlizzardBehavior: SpellBehavior = {
    onCast: (state: GameState, config: SpellDefinition, caster: Player, target: Vector2, callbacks: SpellCallbacks) => {
        // Calculate Radius based on Spell Level (mocked as caster level for now or passed in config)
        // config.baseStats.damagePerLevel... usually we don't have explicit spell instance level in this sig easily 
        // without looking at the cards/spell structure. Assuming caster.level for scaling roughly or baseStats.
        const level = 1; // Default
        const radius = BASE_RADIUS + (level * RADIUS_PER_LEVEL);

        callbacks.createAreaEffect({
            pos: { ...target },
            radius: config.baseStats.aoeRadius || radius,
            duration: config.baseStats.duration || BLIZZARD_DURATION,
            damage: config.baseStats.baseDamage || 3,
            tickInterval: 30, // 2 ticks per second
            color: '#00BFFF',
            type: 'blizzard_storm',
            ownerId: caster.id,
            spellType: SpellType.ICE_BLIZZARD,
            data: {
                slowAmount: 0.4, // 40% slow
                chillStacks: 1,
                rot: 0
            }
        });

        callbacks.addFloatingText("Blizzard!", target, "#00BFFF");
    },

    onTick: (state: GameState, ae: AreaEffect, callbacks: SpellCallbacks) => {
        // Find enemies in radius
        // The AreaEffect system handles "onEnemyHit" via the main loop usually if we just want damage.
        // But for custom effects like SLOW application without status system support for generic "slow", we do it here.
        // Actually, 'appliesSlow' is in status config. 
        // If we want to strictly apply "Chill Stacks" every tick:

        state.enemies.forEach(e => {
            if (e.hp <= 0) return;
            const dx = e.pos.x - ae.pos.x;
            const dy = e.pos.y - ae.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= ae.radius) {
                // Apply Damage & Drift
                // Manual Hit to ensure Chill application
                callbacks.onEnemyHit(e, ae.damage, 'freeze');

                // Add Chill Stack specifically if onEnemyHit doesn't guarantee it from 'freeze' type
                // (Usually 'freeze' type adds chill/freeze status logic in CombatSystem/SpellSystem)

                // Manual Slow (Velocity damping)
                e.velocity.x *= (1 - (ae.data?.slowAmount || 0.3));
                e.velocity.y *= (1 - (ae.data?.slowAmount || 0.3));
            }
        });
    },

    onRender: (ctx: CanvasRenderingContext2D, ae: AreaEffect, x: number, y: number) => {
        // Render Snow Storm
        const rPx = ae.radius * 32;
        const time = performance.now();

        ctx.save();
        ctx.translate(x, y);

        // Ground Ice Patch (Faint)
        ctx.beginPath();
        ctx.ellipse(0, 0, rPx, rPx * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(173, 216, 230, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Spinning Snow Particles
        const count = 25;
        // Ae Data rotation
        ae.data.rot = (ae.data.rot || 0) + 0.02;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + ae.data.rot + (i * 0.1);
            const dist = (Math.sin(time * 0.002 + i) * 0.5 + 0.5) * rPx; // Move in and out

            const px = Math.cos(angle) * dist;
            const py = Math.sin(angle) * dist * 0.5; // Isometric squish

            // Random Height variation to look like a volume
            const h = Math.sin(time * 0.005 + i * 13) * 20 - 10;

            ctx.fillStyle = '#FFFFFF';
            const size = (Math.sin(time * 0.01 + i) + 2) * 1.5;
            ctx.fillRect(px, py + h, size, size);
        }

        ctx.restore();
    }
};
