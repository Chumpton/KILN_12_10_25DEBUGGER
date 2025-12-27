import { GameState, SpellType, Player, Projectile, Vector2, Enemy } from '../../../types';
import { SpellDefinition } from '../SpellRegistry';
import { SpellCallbacks, SpellBehavior } from '../SpellBehavior';

function findPlayerById(state: GameState, id: string): Player | null {
    return state.player.id === id ? state.player : null;
}

export const StoneShieldBehavior: SpellBehavior = {
    onCast: (state: GameState, config: SpellDefinition, caster: Player, _target: Vector2, _callbacks: SpellCallbacks) => {
        if (!caster.buffs) caster.buffs = [];

        const durationMs = config.baseStats?.duration ?? 15000;
        const frames = Math.max(1, Math.floor(durationMs / 16));
        const baseDamage = config.baseStats?.baseDamage ?? 5;

        // Add Buff
        const buffId = `STONE_SHIELD_${Date.now()}`;
        caster.buffs.push({
            id: buffId,
            name: 'Stone Shield',
            icon: 'ui/icons/elements/stone_shield_icon.png',
            duration: durationMs,
            maxDuration: durationMs,
            type: 'buff',
            description: 'Orbiting stones absorb damage.'
        });

        // Talent Lookups
        const talentId = 'EARTH_STONE_SHIELD:hardened_rock';
        const extraHitsRank = caster.spellTalents?.allocations?.[talentId] || 0;
        const totalHits = 1 + extraHitsRank;

        const ROCK_COUNT = 3;
        const ROCK_SIZE = 0.22;
        const RADIUS_WORLD = 1.5; // Increased Radius for visibility (was 0.8)
        const HIP_OFFSET_WORLD_Y = -0.5;

        console.log('[StoneShield] Spawning via Literal Type with totalHits:', totalHits);

        // Spawn rocks evenly around 360 degrees
        for (let i = 0; i < ROCK_COUNT; i++) {
            const phase = (i / ROCK_COUNT) * Math.PI * 2;

            state.projectiles.push({
                id: `stone_shield_${caster.id}_${i}_${Date.now()}`,
                spellType: 'EARTH_STONE_SHIELD' as SpellType, // FORCE LITERAL to avoid undefined Enum issues
                pos: {
                    x: caster.pos.x + Math.cos(phase) * RADIUS_WORLD,
                    y: (caster.pos.y + HIP_OFFSET_WORLD_Y) + Math.sin(phase) * RADIUS_WORLD,
                },
                velocity: { x: 0, y: 0 },
                radius: ROCK_SIZE,
                damage: baseDamage,
                duration: frames,
                isEnemy: false,
                hitList: [],
                data: {
                    orbit: {
                        centerId: caster.id,
                        initialPhase: phase,
                        timer: 0,
                        buffId,
                    },
                    isShield: true,
                    hitsRemaining: totalHits,
                    stoneShield: true
                }
            } as Projectile);
        }
    },

    onUpdate: (state: GameState, p: Projectile, _callbacks: SpellCallbacks) => {
        const o = p.data?.orbit;
        if (!o) return;

        o.timer = (o.timer ?? 0) + 1;

        const caster = findPlayerById(state, o.centerId);
        if (!caster) {
            p.isDead = true;
            return;
        }

        const ORBIT_SPEED = 0.05;      // radians/frame (slightly slower for weight)
        const RADIUS = 1.3;            // tighter orbit
        const HIP_OFFSET_Y = -0.5;

        // Orbit Math
        const t = (o.timer * ORBIT_SPEED) + (o.initialPhase ?? 0);

        p.pos.x = caster.pos.x + Math.cos(t) * RADIUS;
        p.pos.y = (caster.pos.y + HIP_OFFSET_Y) + Math.sin(t) * RADIUS;

        // Visual bob
        p.pos.y += Math.sin(t * 2) * 0.1;

        p.velocity.x = 0;
        p.velocity.y = 0;
    },

    onHit: (state: GameState, p: Projectile, target: Enemy | null, callbacks: SpellCallbacks) => {
        if (target) {
            callbacks.onEnemyHit(target, p.damage ?? 0);
        }

        // Stone Shield rocks are durable but can break
        p.data.hitsRemaining = (p.data.hitsRemaining ?? 3) - 1; // 3 hits before breaking
        if (p.data.hitsRemaining <= 0) {
            p.isDead = true;
            callbacks.createVisualEffect?.('particle', p.pos, 30, { color: '#78716c', radius: 0.5 });
        }
    },

    onRender: (ctx: CanvasRenderingContext2D, p: Projectile, x: number, y: number) => {
        ctx.save();
        ctx.translate(x, y);

        // Draw a proper rock instead of 14px emoji
        const size = (p.radius || 0.22) * 48; // Scale up for visual impact

        ctx.font = `${size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 10, size / 2, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillText('🪨', 0, 0);

        ctx.restore();
    }
};
