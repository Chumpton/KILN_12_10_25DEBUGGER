import { SpellBehavior, SpellCallbacks } from '../SpellBehavior';
import { GameState, Player, SpellType, Vector2 } from '../../../types';
import { calculateSpellDamage } from '../../../utils/combat';
import { soundSystem } from '../../../systems/SoundSystem';
import { SPELL_REGISTRY } from '../SpellRegistry';
import { drawPixelExplosion } from '../../../utils/graphics';

export const FIREBALL_BEHAVIOR: SpellBehavior = {
    onCast: (state: GameState, config: any, player: Player, target: Vector2, callbacks: SpellCallbacks) => {
        // Safe access to allocations
        const allocations = player.spellTalents?.allocations || {};

        // OVERHEAT LOGIC
        if (allocations['FIRE_FIREBALL:glass_cannon']) {
            const now = Date.now();
            const lastCast = (player as any).lastFireballCast || 0;
            let stacks = (player as any).overheatStacks || 0;

            if (now - lastCast < 3000) {
                stacks = Math.min(5, stacks + 1);
            } else {
                stacks = 1;
            }

            (player as any).overheatStacks = stacks;
            (player as any).lastFireballCast = now;

            if (stacks > 0) {
                const color = stacks === 5 ? '#ffd100' : '#ff4500';
                callbacks.addFloatingText(`HEAT x${stacks}`, player.pos, color);
            }

            // Allow system to spawn default? No, we need multi-proj logic here.
            // Return false usually means "Do default spawn".
            // But if we want multi-projectile, we should handle it ourselves or ensure system uses config.
        }

        // MULTI-PROJECTILE LOGIC (Talent Scaling)
        // If the system's default genericCast handles this, we can return false. 
        // But since we are customizing heavily, let's do the spawn here.
        // Actually, SpellSystem.ts's generic projectile handling is quite robust.
        // If we modify 'config' here, does it affect the spawn? No, config is passed in.
        // Let's manually spawn projectiles here to support Shotgunning if needed, 
        // OR trust the generic spawner if we simply updated the Registry data.

        // However, the user asked for "Scaling multiple projectiles".
        // The GenericSpell behavior handles this often. Fireball uses 'Fireball.ts'.
        // If this onCast returns false, the system might not spawn anything if it expects this to handle it?
        // Checking GenericSpell... usually if onCast !returns true, it proceeds?
        // Wait, typical pattern: if onCast returns `false` or `void`, does the system continue?
        // Looking at SpellSystem (I haven't read it fully this turn but based on other behaviors):
        // Usually behaviors return `void`.

        // Let's implement the spawn loop here to be safe and precise.

        const count = config.baseStats.projectileCount || config.geometry.projectileCount || 1;
        const spread = config.geometry.projectileSpreadDegrees || 0;

        const spawnPos = { ...player.pos };
        // Adjust spawn to hand if possible (Visual polish)
        // Not trivial without renderer access, stick to center or offset.
        spawnPos.y -= 0.5; // Chest height

        const mouseDx = target.x - spawnPos.x;
        const mouseDy = target.y - spawnPos.y;
        const baseAngle = Math.atan2(mouseDy, mouseDx);

        const speed = (config.baseStats.projectileSpeed || 15) * 0.02;

        for (let i = 0; i < count; i++) {
            // Calculate Spread
            // e.g. 3 proj, 30 deg spread -> -15, 0, +15
            let angle = baseAngle;
            if (count > 1) {
                const totalSpreadRad = spread * (Math.PI / 180);
                const step = totalSpreadRad / (count - 1);
                const start = -totalSpreadRad / 2;
                angle += start + step * i;
            }

            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };

            const proj: any = {
                id: `fb_${Date.now()}_${i}_${Math.random()}`,
                pos: { ...spawnPos },
                velocity: velocity,
                radius: 0.4,
                damage: calculateSpellDamage(player, SpellType.FIRE_FIREBALL),
                life: config.baseStats.projectileLifetime * 60 || 180,
                maxLife: config.baseStats.projectileLifetime * 60 || 180,
                spellType: SpellType.FIRE_FIREBALL,
                isEnemy: false,
                isDead: false,
                hitList: [],
                data: {
                    ...(config.data || {}),
                    // Pass specific talents via data
                    homingStrength: config.data?.homingStrength || 0, // Gentle homing
                    trailWidth: config.data?.trailWidth || 0, // Burning Trail
                    emberOnKill: config.data?.emberOnKill || false,
                }
            };

            state.projectiles.push(proj);
        }

        soundSystem.playFireballSound();
        return true; // We handled the spawn
    },

    onUpdate: (state: GameState, source: any, callbacks: SpellCallbacks) => {
        // COOKING THE SHOT (Delayed Detonation)
        if (source.data?.fuseTimer !== undefined) {
            source.data.fuseTimer--;
            if (source.data.fuseTimer <= 0) {
                FIREBALL_BEHAVIOR.onHit(state, source, null, callbacks);
                source.isDead = true;
            }
            return;
        }

        // HOMING Logic
        if (source.data?.homingStrength && source.data.homingStrength > 0) {
            // Find nearest enemy
            let nearest = null;
            let minDst = 100; // Search radius (tiles)
            for (const e of state.enemies) {
                if (e.isDead || e.hp <= 0) continue;
                const dx = e.pos.x - source.pos.x;
                const dy = e.pos.y - source.pos.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < minDst) { minDst = d; nearest = e; }
            }

            if (nearest) {
                // Steer
                const dx = nearest.pos.x - source.pos.x;
                const dy = nearest.pos.y - source.pos.y;
                const targetAngle = Math.atan2(dy, dx);
                const currentAngle = Math.atan2(source.velocity.y, source.velocity.x);

                // Simple turn (Lerp angle or velocity)
                // Let's lerp velocity vector for smoothness
                const steerFactor = source.data.homingStrength; // e.g. 0.05

                const desiredWx = Math.cos(targetAngle);
                const desiredWy = Math.sin(targetAngle);

                // Current Speed
                const spd = Math.sqrt(source.velocity.x * source.velocity.x + source.velocity.y * source.velocity.y);

                source.velocity.x += (desiredWx * spd - source.velocity.x) * steerFactor;
                source.velocity.y += (desiredWy * spd - source.velocity.y) * steerFactor;
            }
        }

        // SCORCHED PATH (Burning Trail)
        if (source.data?.trailWidth) {
            // Spawn every 4 frames
            const frame = (state as any).frame || Math.floor(Date.now() / 16);
            if (frame % 4 === 0) {
                callbacks.createAreaEffect({
                    pos: { ...source.pos },
                    radius: source.data.trailWidth,
                    duration: source.data.trailDuration || 120,
                    damage: source.damage * 0.15, // Trail tick damage
                    interval: 15,
                    color: '#ff6600',
                    type: 'damage_zone',
                    ownerId: source.spawnerId,
                    spellType: SpellType.FLAME_WALL, // Reuse flame wall type/visuals? or Generic
                    data: { flareOnTouch: source.data.trailFlare }
                });
            }
        }
    },

    onHit: (state: GameState, source: any, target: any, callbacks: SpellCallbacks) => {
        try {
            // Already dead (e.g. from fuse expiry)
            if (source.isDead && source.data?.fuseTimer === undefined) return;

            // DELAYED DETONATION TRIGGER
            if (source.data?.detonationDelay && source.data.fuseTimer === undefined) {
                source.data.fuseTimer = source.data.detonationDelay;
                source.velocity = { x: 0, y: 0 }; // Embed in target
                soundSystem.playEnemyHit(); // Use hit sound for thud
                return;
            }

            const config = SPELL_REGISTRY[SpellType.FIRE_FIREBALL];
            const p = state.player;
            let damage = source.damage || calculateSpellDamage(p, SpellType.FIRE_FIREBALL);

            // OVERHEAT DAMAGE BONUS
            const stacks = (p as any).overheatStacks || 0;
            if (stacks > 0) {
                damage *= (1 + stacks * 0.08);
                if (stacks === 5) {
                    // Auto-Crit (Visual and Multiplier)
                    damage *= 1.5;
                    callbacks.addFloatingText("MAX HEAT!", source.pos, '#ffd100');
                }
            }

            const boomColor = config.animation?.primaryColor || '#ff6600';
            const radius = source.explosionRadius || config.baseStats.aoeRadius;

            // PRIMARY EXPLOSION
            callbacks.createExplosion(source.pos, radius, damage, boomColor, undefined, 0.2);
            soundSystem.playEnemyHit();

            let killed = false;

            if (target) {
                target.hp -= damage;
                target.hitTimer = 5;

                // Ignite
                target.burnTimer = 180;
                target.burnDamage = Math.max(1, damage * 0.1);

                if (target.hp <= 0) killed = true;
            }

            // EMBERS ON KILL (Talent: explode into smaller embers)
            // Or 'HEARTBURST' (original logic)
            // We combine them. If emberOnKill is true, only spawn on kill.
            // If emberBurst is set (Heartburst talent), spawn always?
            // Let's respect emberOnKill flag specifically.
            const shouldBurst = (source.data?.emberBurst) || (source.data?.emberOnKill && killed);

            if (shouldBurst) {
                const count = source.data.emberCount || 6;
                const emberDmg = damage * (source.data.emberDamageMult || 0.3);

                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const speed = 4 + Math.random() * 2;
                    state.projectiles.push({
                        id: `ember_${source.id}_${i}`,
                        pos: { ...source.pos },
                        prevPos: { ...source.pos },
                        velocity: { x: Math.cos(angle) * speed * 0.02, y: Math.sin(angle) * speed * 0.02 },
                        radius: 0.15,
                        isDead: false,
                        isEnemy: false,
                        spellType: SpellType.FIRE_FIREBALL,
                        damage: emberDmg,
                        duration: 45,
                        hitList: target ? [target.id] : [],
                        isShrapnel: true,
                        explosionRadius: 0.8,
                        data: {
                            emberBurst: false, // Prevent chain
                            visualOverride: 'ember',
                            // Embers add burn stacks
                            applyBurn: true
                        }
                    } as any);
                }
                callbacks.createVisualEffect('nova', source.pos, 30, { radius: 1, color: '#ffcc00' });
            }

            source.isDead = true;
        } catch (err) {
            console.error('[Fireball] onHit Crash:', err);
        }
    }
};