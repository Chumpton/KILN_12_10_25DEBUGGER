
import { SpellBehavior } from '../SpellBehavior';
import { GameState, SpellType, Vector2 } from '../../../types';
import { calculateSpellDamage } from '../../../utils/combat';
import { soundSystem } from '../../../systems/SoundSystem';
import { SPELL_REGISTRY } from '../SpellRegistry';
import { SpellCallbacks } from '../SpellSystem';
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
        // Rate: Frequent (every frame or high chance)
        const density = 2; // Particles per frame
        for (let i = 0; i < density; i++) {
            if (Math.random() < 0.7) {
                const colors = ['#E0FFFF', '#00FFFF', '#FFFFFF', '#ADD8E6'];
                const color = colors[Math.floor(Math.random() * colors.length)];

                // Spread slightly
                const offsetX = (Math.random() - 0.5) * 0.4;
                const offsetY = (Math.random() - 0.5) * 0.4;

                callbacks.createVisualEffect('particle', { x: p.pos.x + offsetX, y: p.pos.y + offsetY }, 20, {
                    color: color,
                    size: Math.random() * 2 + 1, // Tiny (1-3px)
                    velocity: {
                        x: (Math.random() - 0.5) * 0.02, // Very slight drift
                        y: (Math.random() - 0.5) * 0.02
                    },
                    isFading: true,
                    shape: 'rect' // Use Rect for pixels if supported, else Circle is fine at small sizes
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
        const angle = Math.atan2(mouseWorld.y - player.pos.y, mouseWorld.x - player.pos.x);
        const speed = (config.baseStats.projectileSpeed || 10) * 0.5; // Slow for Frost Pulse

        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        // Resolve Origin Offset (Default y-0.5)
        const defaultOffset = { x: 0, y: -0.5 };
        const offset = config.data?.originOffset || defaultOffset;

        const id = `fp_${Date.now()}_${Math.random()}`;
        state.projectiles.push({
            id,
            spawnerId: player.id,
            spellType: SpellType.ICE_FROST_PULSE, // Ensure Type matches
            isEnemy: false,
            pos: { x: player.pos.x + offset.x, y: player.pos.y + offset.y },
            velocity,
            life: config.baseStats.projectileLifetime * 60 || 180,
            maxLife: config.baseStats.projectileLifetime * 60 || 180,
            damage: calculateSpellDamage(player, SpellType.ICE_FROST_PULSE),
            isDead: false,
            data: {
                ...(config.data || {}),
                scaleOverride: config.data?.scaleOverride !== undefined ? config.data.scaleOverride : 1.5,
                trail: [] // Init trail
            },
            radius: 1.5,
            hitList: []
        });

        soundSystem.playFireballSound();
    },

    onHit: (state: GameState, source: any, target: any, callbacks: SpellCallbacks) => {
        const damage = source.damage || calculateSpellDamage(state.player, SpellType.ICE_FROST_PULSE);

        if (target) {
            // --- ENEMY HIT ---
            const e = target;
            e.hp -= damage;

            // Apply CHILL Status
            e.freezeTimer = 180;

            callbacks.addFloatingText(`${Math.round(damage)}`, e.pos, '#00ffff');
            callbacks.createImpactPuff(e.pos, SpellType.ICE_FROST_PULSE);
            soundSystem.playEnemyHit();

            if (e.hp <= 0 && e.enemyState !== 'DYING') {
                e.enemyState = 'DYING';
                e.deathTimer = 30;
                callbacks.onEnemyDeath(e);
            }
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

            // Calculate current screen pos relative to (0,0) of the map/camera projection
            const currentScreen = toScreen(p.pos.x, p.pos.y);

            // Draw Trail relative to the passed 'x,y' (which is the sprite's screen center)
            for (let i = 0; i < p.data.trail.length - 1; i++) {
                const pt1 = p.data.trail[i];
                const pt2 = p.data.trail[i + 1];

                // Convert trail world coords to screen coords
                const s1 = toScreen(pt1.x, pt1.y);
                const s2 = toScreen(pt2.x, pt2.y);

                // Valid checks
                if (!s1 || !s2) continue;

                // Calculate offset from current projectile screen pos
                // This neutralizes camera movement since both use the same toScreen projection (and camera)
                const dx1 = s1.x - currentScreen.x;
                const dy1 = s1.y - currentScreen.y;
                const dx2 = s2.x - currentScreen.x;
                const dy2 = s2.y - currentScreen.y;

                const alpha = (i / p.data.trail.length) * 0.4; // Fade out at tail

                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                ctx.lineWidth = 1 + (i / p.data.trail.length) * 12; // Tapering

                // Draw at (drawX + offset, drawY + offset) - note drawY includes lift already
                // BUT: 'y' passed in includes lift if it's the sprite center? 
                // GameCanvas passes 'screenP.y - lift' usually? 
                // Let's check GameCanvas. It passes screenP.x, screenP.y.
                // And inside here we do `drawY = y - 35`.
                // So `y` is GROUND level. `drawY` is VISUAL center.
                // Does p.pos include Z? No.
                // So `toScreen` returns GROUND level.
                // So `s1.y` is ground level.
                // So `dy1` is diff in GROUND level Y.
                // If we draw at `drawY + dy1`, we are drawing relative to VISUAL center.
                // This effectively "lifts" the entire trail to floating height. This is Correct.

                ctx.moveTo(drawX + dx1, drawY + dy1);
                ctx.lineTo(drawX + dx2, drawY + dy2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Calculate rotation from velocity
        // Calculate rotation from screen-space motion (correct for isometric)
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
            // Scale if needed (Check overrides)
            const scale = (p.data?.scaleOverride !== undefined) ? p.data.scaleOverride : 0.25;
            ctx.scale(scale, scale);
            ctx.drawImage(FROST_PULSE_IMG, -FROST_PULSE_IMG.width / 2, -FROST_PULSE_IMG.height / 2);
            ctx.restore();
        } else {
            // Fallback while loading
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
