
import { GameState, Vector2, Player, SpellType } from '../../../types';
import { SpellDefinition } from '../SpellRegistry';
import { SpellCallbacks } from '../SpellBehavior';
import { createDefaultCastPlan } from '../../cards/CardSystem';

// --- Math Helpers ---
const sub = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: Vector2): number => Math.sqrt(a.x * a.x + a.y * a.y);
const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;
const norm = (a: Vector2): Vector2 => {
    const l = len(a);
    return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};

// Load Visual Asset
const BREATH_IMG = new Image();
BREATH_IMG.src = '/vfx/frost_puff.png';

export const FrostBreathBehavior = {
    onRender: (ctx: CanvasRenderingContext2D, p: any, x: number, y: number) => {
        if (!BREATH_IMG.complete) return;

        let alpha = 1;
        // Fade in
        if (p.life > p.maxLife - 5) {
            alpha = (p.maxLife - p.life) / 5;
        }
        // Fade out
        else if (p.life < 10) {
            alpha = p.life / 10;
        }

        const scale = (p.data?.scale || 0.5) * (1 + (1 - p.life / p.maxLife) * 0.5); // Grow slightly

        const baseX = x;
        const baseY = y - 18; // Lift slightly above ground

        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.globalAlpha = alpha * (p.data?.alpha || 1);
        ctx.scale(scale, scale);
        // Random rotation for natural look
        if (p.data.rotation) ctx.rotate(p.data.rotation);

        ctx.drawImage(BREATH_IMG, -BREATH_IMG.width / 2, -BREATH_IMG.height / 2);
        ctx.restore();

        // render particles (sparkly bits)
        const parts = p.data?.particles;
        if (parts?.length) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';

            for (const s of parts) {
                const t = s.life / s.maxLife;
                ctx.globalAlpha = (p.data?.alpha ?? 1) * s.alpha * t;

                const px = baseX + s.dx;
                const py = baseY + s.dy;

                // Diamond Sparkle
                ctx.fillStyle = 'rgba(220, 245, 255, 1)'; // Bright ice blue
                ctx.beginPath();
                ctx.moveTo(px, py - 2);
                ctx.lineTo(px + 2, py);
                ctx.lineTo(px, py + 2);
                ctx.lineTo(px - 2, py);
                ctx.fill();
            }

            ctx.restore();
        }
    },

    onUpdate: (state: GameState, p: any) => {
        if (!p.data?.isVisual) return;

        // spin
        p.data.rotation = (p.data.rotation ?? 0) + (p.data.spin ?? 0.02); // Slower spin


        // emit sparkles
        if (!p.data.particles) p.data.particles = [];

        // Higher emit rate for sparkly feel
        if (Math.random() < 0.6) {
            const a = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            p.data.particles.push({
                dx: 0,
                dy: 0,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed - 0.5, // Float up slightly
                life: 15 + Math.floor(Math.random() * 15),
                maxLife: 30,
                size: 1,
                alpha: 1.0
            });
        }

        // update sparkles
        for (const s of p.data.particles) {
            s.dx += s.vx;
            s.dy += s.vy;
            s.vy += 0.02; // Gravity? or float?
            s.life -= 1;
        }
        p.data.particles = p.data.particles.filter((s: any) => s.life > 0);
    },

    onCast: (
        state: GameState,
        config: SpellDefinition,
        caster: Player,
        targetPos: Vector2,
        callbacks: SpellCallbacks
    ) => {
        // --- CONFIGURATION ---
        const CONE_ANGLE = 45; // Fixed 45 degrees
        const RADIUS = config.baseStats.aoeRadius ?? 8;
        const PUFFS_PER_TICK = 20; // Requested "20ish"
        const DURATION_TICKS = 240; // 4 Seconds @ 60fps

        const tick = caster.casting?.timer ?? 0;

        // Auto-stop Logic
        if (tick >= DURATION_TICKS) {
            caster.casting.isCasting = false;
            caster.casting.currentSpell = null;
            // Trigger Cooldown manually if needed, usually handled by spell system on uncast
            return;
        }

        const origin = caster.pos;
        const dir = norm(sub(targetPos, origin));
        const perp = { x: -dir.y, y: dir.x };

        // Spawn Breath Puffs (Projectiles)
        let spawned = 0;
        // Distribute puffs within the cone shape
        // We calculate the maximum width at full radius
        const maxConeHalfWidth = RADIUS * Math.tan((CONE_ANGLE * Math.PI / 180) / 2);

        while (spawned < PUFFS_PER_TICK) {
            // Random distance along cone (weighted towards end for better coverage or uniform?)
            // Uniform looks better for a stream
            const d = Math.random() * RADIUS;
            const t = d / RADIUS;

            // Width at this distance
            const w = t * maxConeHalfWidth;

            // Random offset from center line
            const offset = (Math.random() - 0.5) * 2 * w;

            const spawnPos = {
                x: origin.x + dir.x * d + perp.x * offset,
                y: origin.y + dir.y * d + perp.y * offset
            };

            // Calculate velocity - exhale outward
            const speed = 4 + Math.random() * 2;
            const vel = { x: dir.x * speed * 0.01, y: dir.y * speed * 0.01 };

            const life = 60 + Math.floor(Math.random() * 40); // Increased life to ~1-1.5s

            state.projectiles.push({
                id: `fb_puff_${tick}_${spawned}_${Math.random()}`,
                spellType: SpellType.FROST_BREATH,
                isEnemy: false,
                pos: spawnPos,
                velocity: vel,
                life,
                maxLife: life,
                damage: 0,
                radius: 0.1,
                isDead: false,
                hitList: [],
                data: {
                    isVisual: true,
                    skipPhysics: true,
                    skipCollision: true,
                    scale: 0.4 + Math.random() * 0.4,
                    alpha: 0.7 + Math.random() * 0.3,
                    rotation: Math.random() * Math.PI * 2,
                    spin: (Math.random() - 0.5) * 0.1,
                    particles: []
                },
                duration: life,
            } as any);

            spawned++;
        }

        // --- CONE HIT DETECTION ---
        // We only tick damage every X frames to avoid melting enemies instantly?
        // Or damage per tick is very low.
        // Assuming damage is per tick but low, or we throttle hits.
        // Let's throttle hits to every 10 frames (6 hits per second)
        if (tick % 10 !== 0) return;

        const cosThreshold = Math.cos((CONE_ANGLE / 2) * (Math.PI / 180));

        state.enemies.forEach(e => {
            if (e.hp <= 0) return;

            const toEnemy = sub(e.pos, origin);
            const dist = len(toEnemy);

            if (dist > RADIUS) return;

            const toEnemyDir = norm(toEnemy);
            const alignment = dot(dir, toEnemyDir);

            if (alignment >= cosThreshold) {
                // HIT
                const damage = config.baseStats.baseDamage ?? 5; // Low base damage per tick

                if (!e.status) e.status = {};

                // Frozen Check
                if ((e.status.frozenTimer ?? 0) > 0) {
                    callbacks.onEnemyHit(e, damage * 1.5); // Crit frozen targets
                    return;
                }

                // Chill Stacking
                e.status.chillStacks = (e.status.chillStacks ?? 0) + 1;

                // Freeze Threshold
                if (e.status.chillStacks >= 5) { // 5 stacks to freeze
                    e.status.frozenTimer = 90; // 1.5s freeze
                    e.status.chillStacks = 0;
                    callbacks.onEnemyHit(e, damage, 'freeze');

                    // Visual Effect
                    callbacks.addFloatingText("FROZEN!", e.pos, '#00ffff');
                } else {
                    callbacks.onEnemyHit(e, damage);
                }
            }
        });
    }
};

