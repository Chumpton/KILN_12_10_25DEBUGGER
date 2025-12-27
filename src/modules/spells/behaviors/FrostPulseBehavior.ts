
import { SpellBehavior } from '../SpellBehavior';
import { GameState, SpellType, Vector2 } from '../../../types';
import { calculateSpellDamage } from '../../../utils/combat';
import { soundSystem } from '../../../systems/SoundSystem';
import { SPELL_REGISTRY } from '../SpellRegistry';
// Fixed Import
import { SpellCallbacks } from '../SpellBehavior';
import { toScreen } from '../../../utils/isometric';

const FROST_PULSE_IMG = new Image();
FROST_PULSE_IMG.src = '/vfx/frost_pulse_wave.png';

export const FROST_PULSE_BEHAVIOR: SpellBehavior = {
    // Uses Default SpellSystem Projectile Logic for casting
    onUpdate: (state: GameState, p: any, callbacks: SpellCallbacks) => {
        // 1. Maintain Trail History for Comet Tail
        if (!p.data.trail) {
            p.data.trail = [];
        }
        p.data.trail.push({ x: p.pos.x, y: p.pos.y });
        if (p.data.trail.length > 15) p.data.trail.shift();

        // 2. Emit Tiny Pixels (Lamination)
        const density = 2; // Particles per frame
        for (let i = 0; i < density; i++) {
            if (Math.random() < 0.7) {
                const colors = ['#E0FFFF', '#00FFFF', '#FFFFFF', '#ADD8E6'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const offsetX = (Math.random() - 0.5) * 0.4;
                const offsetY = (Math.random() - 0.5) * 0.4;

                callbacks.createVisualEffect('particle', { x: p.pos.x + offsetX, y: p.pos.y + offsetY }, 20, {
                    color: color,
                    size: Math.random() * 2 + 1,
                    velocity: {
                        x: (Math.random() - 0.5) * 0.02,
                        y: (Math.random() - 0.5) * 0.02
                    },
                    isFading: true,
                    shape: 'rect'
                });
            }
        }

        // 3. WHITE SNOW TRAIL (Talent)
        if (p.data?.snowTrail) {
            // Drop permanent/long-lasting snow patches
            // Throttle to every ~10 frames (distance based?)
            const frame = Math.floor(Date.now() / 16);
            if (frame % 8 === 0) {
                // Create a visual-only area effect or decal
                // Using AreaEffect with 0 damage for visual persistence
                callbacks.createAreaEffect({
                    pos: { ...p.pos },
                    radius: 0.8,
                    duration: 300, // 5 seconds
                    damage: 0,
                    tickInterval: 9999,
                    color: '#ffffff',
                    type: 'generic', // Custom renderer needed? Or just white circle
                    data: {
                        isVisual: true,
                        visualType: 'snow_patch'
                        // We can add logic to 'GenericSpell' or 'AreaEffectRenderer' to render this as a snow sprite
                        // For now, simple white circle.
                    }
                });
            }
        }
    },
    onCast: (state: GameState, config: any, player: any, mouseWorld: any, callbacks: SpellCallbacks) => {
        // 1. START CASTING (if has cast time and not already casting)
        if (config.baseStats.castTime > 0 && (!player.casting.isCasting || player.casting.timer < player.casting.duration)) {
            if (!player.casting.isCasting) {
                player.casting.isCasting = true;
                player.casting.currentSpell = config.id;
                player.casting.duration = config.baseStats.castTime * 60;
                player.casting.timer = 0;
                player.casting.targetPos = { ...mouseWorld };
            }
            return; // Wait for system to tick and recall fireSpell
        }

        // 2. FIRE PROJECTILE (Cast finished or Instant)
        // SHOTGUN LOGIC
        const count = config.baseStats.projectileCount || config.geometry?.projectileCount || 1;
        const spread = config.geometry?.projectileSpreadDegrees || 30; // Default 30 deg spread for shotgun if count > 1

        const dx = mouseWorld.x - player.pos.x;
        const dy = mouseWorld.y - player.pos.y;
        const baseAngle = Math.atan2(dy, dx);

        const speed = (config.baseStats.projectileSpeed || 10) * 0.5;

        // Muzzle Offsets
        const muzzleForward = config.data?.muzzleForward ?? 0.45;
        const muzzleSide = config.data?.muzzleSide ?? 0.12;
        const muzzleUp = config.data?.muzzleUp ?? 0.00;

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;
            if (count > 1) {
                const totalSpreadRad = spread * (Math.PI / 180);
                const step = totalSpreadRad / (count - 1);
                const start = -totalSpreadRad / 2;
                angle += start + step * i;
            }

            const dir = { x: Math.cos(angle), y: Math.sin(angle) };
            const right = { x: -dir.y, y: dir.x };

            const spawnPos = {
                x: player.pos.x + dir.x * muzzleForward + right.x * muzzleSide,
                y: player.pos.y + dir.y * muzzleForward + right.y * muzzleSide + muzzleUp,
            };

            const velocity = { x: dir.x * speed, y: dir.y * speed };

            const id = `fp_${Date.now()}_${i}_${Math.random()}`;

            state.projectiles.push({
                id,
                spawnerId: player.id,
                spellType: SpellType.ICE_FROST_PULSE,
                isEnemy: false,
                pos: spawnPos,
                velocity,
                life: config.baseStats.projectileLifetime * 60 || 180,
                maxLife: config.baseStats.projectileLifetime * 60 || 180,
                damage: calculateSpellDamage(player, SpellType.ICE_FROST_PULSE),
                isDead: false,
                data: {
                    ...(config.data || {}),
                    scaleOverride: config.data?.scaleOverride !== undefined ? config.data.scaleOverride : 1.5,
                    trail: [],
                    snowTrail: config.data?.snowTrail || true, // Enable by default or via config
                    pierceCount: config.baseStats.maxPenetrations || config.geometry.maxPenetrations || 0
                },
                radius: 1.5,
                hitList: []
            });
        }

        soundSystem.playFireballSound(); // Need ice sound?
    },

    onHit: (state: GameState, source: any, target: any, callbacks: SpellCallbacks) => {
        const damage = source.damage || calculateSpellDamage(state.player, SpellType.ICE_FROST_PULSE);

        if (target) {
            // --- ENEMY HIT ---
            const e = target;
            callbacks.onEnemyHit(e, damage, 'freeze');
            soundSystem.playEnemyHit();

            // KNOCKBACK (Talent: Slight Knockback)
            if (source.data?.knockbackForce || true) { // Default true as requested "Slight Knockback"
                const force = source.data?.knockbackForce || 0.15;
                // Direction based on projectile velocity
                const vLen = Math.sqrt(source.velocity.x * source.velocity.x + source.velocity.y * source.velocity.y);
                if (vLen > 0) {
                    e.velocity.x += (source.velocity.x / vLen) * force;
                    e.velocity.y += (source.velocity.y / vLen) * force;
                }
            }

            // PIERCE LOGIC
            if (source.data?.pierceCount && source.data.pierceCount > 0) {
                source.data.pierceCount--;
                // Don't kill projectile
                // Add to hitList logic usually handled by System. 
                // If System calls onHit, it might auto-kill unless we reset isDead or system handles pierce?
                // SpellSystem usually kills AFTER onHit.
                // We must mark it as NOT dead if we want it to survive.
                // HOWEVER, if the System sees it hit, it adds to hitList. 
                // We need to ensure we don't hit the SAME enemy next frame.
                // source.hitList is managed by System.
                source.isDead = false;
                return; // Return early
            }

            source.isDead = true;
        } else {
            // --- WALL HIT ---
            callbacks.createImpactPuff(source.pos, SpellType.ICE_FROST_PULSE);
            source.isDead = true;
        }
    },

    onRender: (ctx: CanvasRenderingContext2D, p: any, x: number, y: number) => {
        const drawX = x;
        const drawY = y - 35; // Lift

        // --- COMET TAIL RENDER ---
        if (p.data?.trail && p.data.trail.length > 2) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const currentScreen = toScreen(p.pos.x, p.pos.y);

            for (let i = 0; i < p.data.trail.length - 1; i++) {
                const pt1 = p.data.trail[i];
                const pt2 = p.data.trail[i + 1];

                const s1 = toScreen(pt1.x, pt1.y);
                const s2 = toScreen(pt2.x, pt2.y);

                if (!s1 || !s2) continue;

                const dx1 = s1.x - currentScreen.x;
                const dy1 = s1.y - currentScreen.y;
                const dx2 = s2.x - currentScreen.x;
                const dy2 = s2.y - currentScreen.y;

                const alpha = (i / p.data.trail.length) * 0.4;

                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                ctx.lineWidth = 1 + (i / p.data.trail.length) * 12;

                ctx.moveTo(drawX + dx1, drawY + dy1);
                ctx.lineTo(drawX + dx2, drawY + dy2);
                ctx.stroke();
            }
            ctx.restore();
        }

        const s0 = toScreen(p.pos.x, p.pos.y);
        const s1 = toScreen(p.pos.x + p.velocity.x, p.pos.y + p.velocity.y);
        const screenDx = s1.x - s0.x;
        const screenDy = s1.y - s0.y;

        let rotation = Math.atan2(screenDy, screenDx);
        if (p.data?.rotationOffset) {
            rotation += p.data.rotationOffset;
        }

        if (FROST_PULSE_IMG.complete) {
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.rotate(rotation);
            const scale = (p.data?.scaleOverride !== undefined) ? p.data.scaleOverride : 0.25;
            ctx.scale(scale, scale);
            ctx.drawImage(FROST_PULSE_IMG, -FROST_PULSE_IMG.width / 2, -FROST_PULSE_IMG.height / 2);
            ctx.restore();
        } else {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
