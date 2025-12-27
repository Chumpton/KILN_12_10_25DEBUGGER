




import { GameState, Vector2, SpellType, Enemy, Player, EquipmentItem } from '../types';
import { getTileAt } from '../modules/world/WorldGen';
import { getDistance, normalize, toWorld } from '../utils/isometric';
import { BEHAVIOR_REGISTRY } from '../modules/spells/BehaviorRegistry';
import { SPELL_REGISTRY } from '../modules/spells/SpellRegistry';
import { ENEMY_CASTER_CONFIG, ZOMBIE_CONFIG, ENEMY_PHASE_DURATION, SHIELD_COOLDOWN, SHIELD_REGEN_RATE, MANA_REGEN, SHOP_RESET_DURATION, ROCK_AURA_CONFIG, LEVEL_5_UNLOCK, KILLS_PER_CHARGE, POTION_MAX_CHARGES, INVENTORY_GRID_W, INVENTORY_GRID_H, HEARTHSTONE_POS, SAFE_ZONE_RADIUS, RARITY_COLORS, SPITTER_CONFIG } from '../constants';
import { spawnLoot, generateShopItems } from './SpawnSystem';
import { SpellCallbacks } from '../modules/spells/SpellSystem';
import { soundSystem } from './SoundSystem';
import { createXpOrb } from '../utils/factory';
import { pointInEllipse, pointInRotatedRect } from '../utils/geometry';

import { handleEnemyDeath } from '../utils/gameLogic';

export const isPositionValid = (state: GameState, x: number, y: number, radius: number): boolean => {
    const checkRadius = 2;
    const minX = Math.floor(x - checkRadius);
    const maxX = Math.ceil(x + checkRadius);
    const minY = Math.floor(y - checkRadius);
    const maxY = Math.ceil(y + checkRadius);

    for (let tx = minX; tx <= maxX; tx++) {
        for (let ty = minY; ty <= maxY; ty++) {
            const tile = getTileAt(tx, ty);
            if (tile.hasTree) {
                // Check if tree is burnt
                const treeState = state.trees[`${tx},${ty}`];
                if (treeState && treeState.isBurnt) continue;

                const treePos = { x: tx + 0.5, y: ty + 0.5 };
                const dist = getDistance({ x, y }, treePos);
                if (dist < (radius + 0.75)) {
                    return false;
                }
            }
        }
    }
    // Check World Objects (Placed via Editor)
    if (state.worldObjects) {
        for (const obj of state.worldObjects) {
            if (obj.assetType === 'tile') continue; // Walk on tiles
            if (obj.id.toLowerCase().includes('flower') || obj.assetPath.toLowerCase().includes('flower')) continue; // Walk through flowers
            if (obj.id.toLowerCase().includes('grass') || obj.assetPath.toLowerCase().includes('grass')) continue; // Walk through grass objects
            if (obj.id.toLowerCase().includes('dirt') || obj.assetPath.toLowerCase().includes('dirt')) continue; // Walk through dirt objects

            const width = obj.width || 64; // Default to 1 tile if missing
            const scale = obj.scale || 1;

            // Defines collision radius in World Units
            let collisionRadius = 0;

            if (obj.assetPath.includes('tree') || obj.id.includes('tree')) {
                // Trees: Small trunk collision
                collisionRadius = (width * scale / 64) * 0.15;
            } else {
                // Others: Base footprint (approx 80% of width)
                collisionRadius = (width * scale / 64) * 0.4;
            }

            // Simple Circle Distance Check (World Space is top-down ground plane)
            const dist = getDistance({ x, y }, obj.pos);
            if (dist < (radius + collisionRadius)) {
                return false;
            }
        }
    }

    // Shadow Form: Pass through everything except boundaries (if we had map boundaries)
    // Actually, allowing pass through trees/objects is what we want.
    if (state.player.morph === 'SHADOW') return true;

    return true;
};

export const takePlayerDamage = (state: GameState, amount: number, callbacks: SpellCallbacks) => {
    const { player } = state;

    // Defense Logic (Row E)
    if (player.activeBuffs.deflection > 0) {
        if (Math.random() < 0.5) {
            callbacks.addFloatingText("DODGE", player.pos, '#ffffff');
            return; // 50% Dodge
        }
    }
    if (player.activeBuffs.stoneskin > 0) {
        amount *= 0.5; // 50% DR
    }
    // Bear Form DR
    if (player.morph === 'BEAR') {
        amount *= 0.5; // 50% DR (Stacks multiplicatively with Stoneskin -> 75% DR)
    }

    player.shieldRegenTimer = SHIELD_COOLDOWN;
    let remainingDamage = amount;
    if (player.shield > 0) {
        if (player.shield >= remainingDamage) {
            player.shield -= remainingDamage;
            remainingDamage = 0;
        } else {
            remainingDamage -= player.shield;
            player.shield = 0;
        }
    }
    if (remainingDamage > 0) {
        player.hp -= remainingDamage;
        callbacks.addFloatingText(`-${Math.round(remainingDamage)}`, player.pos, '#ef4444');
        if (player.hp <= 0) state.gameOver = true;
    }
};



const enemyShoot = (state: GameState, e: Enemy) => {
    const { player } = state;
    const dir = normalize({ x: player.pos.x - e.pos.x, y: player.pos.y - e.pos.y });

    // Spitter shoots "Acid", Caster shoots "Fire" (generic)
    const spellType = e.type === 'spitter' ? SpellType.ACID_SPIT : SpellType.FIRE;

    state.projectiles.push({
        id: `eproj_${Date.now()}_${Math.random()}`,
        pos: { ...e.pos },
        velocity: { x: dir.x * 0.15, y: dir.y * 0.15 },
        radius: 0.26,
        isDead: false,
        spellType: spellType,
        damage: e.damage,
        duration: 120,
        hitList: [],
        isEnemy: true,
    });
};

export const updatePhysics = (
    state: GameState,
    input: { leftMouseDown: boolean },
    moveTargetRef: { current: Vector2 | null },
    callbacks: SpellCallbacks
) => {
    // Helper check for safe zone collision
    // Helper check for safe zone collision - DISABLED
    const isInsideSafeZone = (x: number, y: number): boolean => {
        return false;
    };

    // Shop Logic
    state.shopResetTimer--;
    if (state.shopResetTimer <= 0) {
        state.shopItems = generateShopItems(state.player.level);
        state.shopResetTimer = SHOP_RESET_DURATION;
        callbacks.addFloatingText("Shop Refreshed!", state.player.pos, '#fbbf24');
    }

    // Process Tree Burning
    Object.keys(state.trees).forEach(key => {
        const tree = state.trees[key];
        if (!tree.isBurnt) {
            tree.burnTimer--;
            if (tree.burnTimer <= 0) {
                tree.isBurnt = true;
            }
        }
    });

    state.player.mana = Math.min(state.player.maxMana, state.player.mana + MANA_REGEN);
    if (state.player.shieldRegenTimer > 0) {
        state.player.shieldRegenTimer--;
    } else if (state.player.shield < state.player.maxShield) {
        state.player.shield = Math.min(state.player.maxShield, state.player.shield + SHIELD_REGEN_RATE);
    }
    if (state.player.activeBuffs.speedBoost > 0) state.player.activeBuffs.speedBoost--;
    if (state.player.activeBuffs.rockAuraTimer > 0) state.player.activeBuffs.rockAuraTimer--;
    if (state.player.activeBuffs.stoneskin > 0) state.player.activeBuffs.stoneskin--;
    if (state.player.activeBuffs.thorns > 0) state.player.activeBuffs.thorns--;
    if (state.player.activeBuffs.deflection > 0) state.player.activeBuffs.deflection--;
    if (state.player.activeBuffs.morphTimer > 0) {
        state.player.activeBuffs.morphTimer--;
        if (state.player.activeBuffs.morphTimer <= 0) {
            state.player.morph = 'NONE';
            callbacks.addFloatingText("Morph Ends", state.player.pos, '#a855f7');
        }
    }



    // RIGHTEOUS FIRE


    // AREA EFFECTS (Firestorm & Flame Wall)
    state.areaEffects = state.areaEffects.filter(ae => !ae.isDead);
    state.areaEffects.forEach(ae => {
        ae.duration--;
        if (ae.duration <= 0) ae.isDead = true;

        ae.tickTimer++;
        if (ae.tickTimer >= ae.tickInterval) {
            ae.tickTimer = 0;

            // --- MODULAR BEHAVIOR ---
            const config = SPELL_REGISTRY[ae.spellType];
            const behaviorKey = config?.behaviorKey || 'GenericBehavior';
            const behavior = BEHAVIOR_REGISTRY[behaviorKey];

            if (behavior?.onTick) {
                behavior.onTick(state, ae, callbacks);
            }


        }

    });

    // Projectiles
    state.projectiles.forEach(p => {
        if (p.isDead) return;

        // Visual Projectile Optimization
        if (p.data?.skipPhysics || p.data?.isVisual) {
            const config = SPELL_REGISTRY[p.spellType];
            const behaviorKey = config?.behaviorKey || 'GenericBehavior';
            const behavior = BEHAVIOR_REGISTRY[behaviorKey];
            behavior?.onUpdate?.(state, p, callbacks);

            // basic motion + life decrement, then continue (skip collisions)
            p.pos.x += p.velocity.x;
            p.pos.y += p.velocity.y;
            p.duration -= 1;
            if (p.duration <= 0) p.isDead = true;
            return;
        }

        // --- BUFF WALL CHECK (Passing through Flame Wall) ---
        if (!p.isEnemy && !p.passedFlameWall) {
            state.areaEffects.forEach(ae => {
                if (ae.spellType === SpellType.FLAME_WALL) {
                    const wallRect = { cx: ae.pos.x, cy: ae.pos.y, width: ae.width || 6, height: ae.height || 1, rotation: ae.rotation || 0 };
                    if (pointInRotatedRect(p.pos, wallRect)) {
                        p.passedFlameWall = true;
                        p.damage *= 1.5; // 50% Damage Buff
                        p.radius = (p.radius || 0.2) * 1.5; // Bigger
                        callbacks.addFloatingText("BUFFED!", p.pos, '#ff4500');
                        // Maybe mark it to apply burn on hit? 
                        // For now just dmg buff.
                    }
                }
            });
        }



        if (p.spellType === SpellType.BOMB && p.targetPos) {
            const distToTarget = getDistance(p.pos, p.targetPos);
            if (distToTarget < 0.2) {
                p.isDead = true;
                const config = SPELL_REGISTRY[SpellType.BOMB];
                const behavior = BEHAVIOR_REGISTRY[config?.behaviorKey || 'BombBehavior'];
                if (behavior?.onHit) behavior.onHit(state, p, null, callbacks);
                return;
            }
        }

        const nextX = p.pos.x + p.velocity.x;
        const nextY = p.pos.y + p.velocity.y;

        if (p.spellType !== SpellType.BOMB && !isPositionValid(state, nextX, nextY, p.radius)) {
            p.isDead = true;

            // Delegate Wall Hit to Behavior
            const config = SPELL_REGISTRY[p.spellType];
            const behaviorKey = config?.behaviorKey || 'GenericBehavior';
            const behavior = BEHAVIOR_REGISTRY[behaviorKey];

            if (behavior?.onHit) {
                behavior.onHit(state, p, null, callbacks);
            } else if (p.spellType === SpellType.FIRE) {
                // Fallback if behavior missing (shouldn't happen for Fire now)
                // But cleaning up legacy block entirely as we migrated it.
            }
        } else {
            p.pos.x = nextX;
            p.pos.y = nextY;
        }

        p.duration--;
        if (p.duration <= 0) {
            p.isDead = true;
            if (p.spellType === SpellType.BOMB) {
                const config = SPELL_REGISTRY[SpellType.BOMB];
                const behavior = BEHAVIOR_REGISTRY[config?.behaviorKey || 'BombBehavior'];
                if (behavior?.onHit) behavior.onHit(state, p, null, callbacks);
            }
        }
    });

    // Enemies
    state.enemies.forEach(e => {
        if (e.isDead) return;

        // --- VELOCITY & FRICTION PHYSICS ---
        // If entity has significant velocity (knockback), move it and apply friction
        const speedSq = e.velocity.x * e.velocity.x + e.velocity.y * e.velocity.y;
        if (speedSq > 0.0001) {
            const nextX = e.pos.x + e.velocity.x;
            const nextY = e.pos.y + e.velocity.y;

            // Check bounds (Safe zone / Map) for knockback movement
            if (isPositionValid(state, nextX, nextY, e.radius) && !isInsideSafeZone(nextX, nextY)) {
                e.pos.x = nextX;
                e.pos.y = nextY;
            } else {
                // Hit wall/safe zone, stop velocity
                e.velocity.x = 0;
                e.velocity.y = 0;
            }

            // Apply friction
            e.velocity.x *= 0.8;
            e.velocity.y *= 0.8;

            // If slow enough, clamp to 0 to resume AI control
            if (e.velocity.x * e.velocity.x + e.velocity.y * e.velocity.y < 0.0001) {
                e.velocity.x = 0;
                e.velocity.y = 0;
            }
            // Skip AI movement if being knocked back hard
            if (speedSq > 0.01) return;
        }

        if (e.burnTimer > 0) {
            e.burnTimer--;
            if (e.burnTimer % 25 === 0) {
                e.hp -= e.burnDamage;
                callbacks.addFloatingText(`${Math.round(e.burnDamage)}`, e.pos, '#ef4444');
                soundSystem.playEnemyHit(); // Burn tick sound
                if (e.hp <= 0) { e.isDead = true; handleEnemyDeath(state, e, callbacks); }
            }
        }

        if (e.isFrozen) {
            e.freezeTimer--;
            if (e.freezeTimer <= 0) e.isFrozen = false;
        }

        if (e.stunTimer && e.stunTimer > 0) {
            e.stunTimer--;
            // Stunned enemies do not move or attack
            return;
        }

        const speed = e.isFrozen ? e.speed * 0.5 : e.speed;
        const distToPlayer = getDistance(e.pos, state.player.pos);

        // --- AI STATE MACHINE ---

        // 1. Determine State
        const aggroRange = 14; // Increased from 8 (approx 350px equivalent)
        const deAggroRange = 9999; // Effectively infinite

        if (distToPlayer < aggroRange) {
            e.aiState = 'CHASE';
        }

        // Determine Facing Logic
        // If attacking or close to player, face player.
        // Otherwise face movement direction.
        if (e.aiState === 'CHASE') {
            e.facingRight = state.player.pos.x > e.pos.x;
        } else if (Math.abs(e.velocity.x) > 0.1) {
            e.facingRight = e.velocity.x > 0;
        } else if (e.patrolTarget) {
            e.facingRight = e.patrolTarget.x > e.pos.x;
        }

        // 2. Execute State Behavior
        if (e.aiState === 'CHASE') {
            // --- CHASE / COMBAT LOGIC (Existing AI) ---

            if (e.isPhasing) {
                e.phaseTimer--;
                if (e.phaseTimer <= 0) e.isPhasing = false;
            }

            // Unstuck Logic
            if (!e.stuckCheckTimer) e.stuckCheckTimer = 0;
            e.stuckCheckTimer++;
            if (e.stuckCheckTimer >= 60) {
                const distToLast = getDistance(e.pos, e.lastStuckPos || e.pos);
                if (distToLast < 0.5) {
                    e.stuckCounter = (e.stuckCounter || 0) + 1;
                } else {
                    e.stuckCounter = 0;
                }
                e.lastStuckPos = { ...e.pos };
                e.stuckCheckTimer = 0;

                if (e.stuckCounter && e.stuckCounter >= 3) {
                    e.isPhasing = true;
                    e.phaseTimer = ENEMY_PHASE_DURATION;
                    e.stuckCounter = 0;
                    callbacks.addFloatingText("Ghosting", e.pos, '#888');
                }
            }

            // Collision helpers
            const isCollidingWithPlayer = (x: number, y: number, radius: number): boolean => {
                const dist = getDistance({ x, y }, state.player.pos);
                return dist < (radius + state.player.radius);
            };
            const isCollidingWithEnemies = (me: Enemy, x: number, y: number): boolean => {
                for (const other of state.enemies) {
                    if (other.id === me.id || other.isDead) continue;
                    if (getDistance({ x, y }, other.pos) < (me.radius + other.radius)) return true;
                }
                return false;
            }

            // --- RANGED vs MELEE BEHAVIOR ---
            if (e.type === 'caster' || e.type === 'spitter') {
                const preferredDist = e.type === 'spitter' ? SPITTER_CONFIG.range : ENEMY_CASTER_CONFIG.range;

                // Move towards or away to maintain range
                if (distToPlayer > preferredDist) {
                    const dir = normalize({ x: state.player.pos.x - e.pos.x, y: state.player.pos.y - e.pos.y });
                    const moveSpeed = speed * 0.03;
                    const nextX = e.pos.x + dir.x * moveSpeed;
                    const nextY = e.pos.y + dir.y * moveSpeed;

                    if (e.isPhasing) {
                        if (!isCollidingWithPlayer(nextX, nextY, e.radius) && !isInsideSafeZone(nextX, nextY)) {
                            e.pos.x = nextX;
                            e.pos.y = nextY;
                        }
                    } else {
                        if (isPositionValid(state, nextX, e.pos.y, e.radius) && !isCollidingWithPlayer(nextX, e.pos.y, e.radius) && !isCollidingWithEnemies(e, nextX, e.pos.y) && !isInsideSafeZone(nextX, e.pos.y)) e.pos.x = nextX;
                        if (isPositionValid(state, e.pos.x, nextY, e.radius) && !isCollidingWithPlayer(e.pos.x, nextY, e.radius) && !isCollidingWithEnemies(e, e.pos.x, nextY) && !isInsideSafeZone(e.pos.x, nextY)) e.pos.y = nextY;
                    }
                } else if (distToPlayer < preferredDist - 2) {
                    const dir = normalize({ x: e.pos.x - state.player.pos.x, y: e.pos.y - state.player.pos.y });
                    const moveSpeed = speed * 0.02;
                    const nextX = e.pos.x + dir.x * moveSpeed;
                    const nextY = e.pos.y + dir.y * moveSpeed;

                    if (e.isPhasing) {
                        if (!isCollidingWithPlayer(nextX, nextY, e.radius) && !isInsideSafeZone(nextX, nextY)) {
                            e.pos.x = nextX;
                            e.pos.y = nextY;
                        }
                    } else {
                        if (isPositionValid(state, nextX, e.pos.y, e.radius) && !isCollidingWithPlayer(nextX, e.pos.y, e.radius) && !isCollidingWithEnemies(e, nextX, e.pos.y) && !isInsideSafeZone(nextX, e.pos.y)) e.pos.x = nextX;
                        if (isPositionValid(state, e.pos.x, nextY, e.radius) && !isCollidingWithPlayer(e.pos.x, nextY, e.radius) && !isCollidingWithEnemies(e, e.pos.x, nextY) && !isInsideSafeZone(e.pos.x, nextY)) e.pos.y = nextY;
                    }
                }

                if (e.attackCooldown > 0) e.attackCooldown--;
                if (distToPlayer < preferredDist + 2 && e.attackCooldown <= 0) {
                    enemyShoot(state, e);
                    e.attackCooldown = e.type === 'spitter' ? SPITTER_CONFIG.cooldown : ENEMY_CASTER_CONFIG.cooldown;
                }

            } else {
                // MELEE BEHAVIOR
                if (e.isAttacking) {
                    const elapsed = Date.now() - e.attackStartTime;
                    const duration = 300;
                    if (elapsed >= 150 && !e.didDamage) {
                        const currentDist = getDistance(e.pos, state.player.pos);
                        // Attack hit check range: Enemy Radius + Player Radius + Weapon Reach (0.5)
                        if (currentDist < (e.radius + state.player.radius + 0.8)) {
                            takePlayerDamage(state, e.damage, callbacks);

                            // Thorns (Row E)
                            if (state.player.activeBuffs.thorns > 0) {
                                e.hp -= e.damage; // Reflect 100%
                                callbacks.addFloatingText(`${Math.round(e.damage)}`, e.pos, '#8b5cf6'); // Violet for magic reflect
                                callbacks.createImpactPuff(e.pos, SpellType.ARCANE_EXPLOSION);
                            }
                        }
                        e.didDamage = true;
                    }
                    if (elapsed >= duration) {
                        e.isAttacking = false;
                        const cooldownMs = 1000 + Math.random() * 1000;
                        e.nextAttackTime = Date.now() + cooldownMs;
                    }
                } else {
                    // Attack Range: Body radii + a small gap (0.6)
                    const attackRange = e.radius + state.player.radius + 0.6;

                    if (distToPlayer < attackRange && Date.now() > e.nextAttackTime) {
                        e.isAttacking = true;
                        e.attackStartTime = Date.now();
                        e.didDamage = false;
                    }
                    else if (distToPlayer > 0.1) {
                        const dx = state.player.pos.x - e.pos.x;
                        const dy = state.player.pos.y - e.pos.y;
                        const moveSpeed = speed * 0.03;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const ndx = dx / dist;
                        const ndy = dy / dist;
                        const vx = ndx * moveSpeed;
                        const vy = ndy * moveSpeed;

                        if (e.isPhasing) {
                            if (!isCollidingWithPlayer(e.pos.x + vx, e.pos.y + vy, e.radius) && !isInsideSafeZone(e.pos.x + vx, e.pos.y + vy)) {
                                e.pos.x += vx;
                                e.pos.y += vy;
                            }
                        } else {
                            let moved = false;
                            if (isPositionValid(state, e.pos.x + vx, e.pos.y, e.radius) && !isCollidingWithPlayer(e.pos.x + vx, e.pos.y, e.radius) && !isCollidingWithEnemies(e, e.pos.x + vx, e.pos.y) && !isInsideSafeZone(e.pos.x + vx, e.pos.y)) {
                                e.pos.x += vx;
                                moved = true;
                            }
                            if (isPositionValid(state, e.pos.x, e.pos.y + vy, e.radius) && !isCollidingWithPlayer(e.pos.x, e.pos.y + vy, e.radius) && !isCollidingWithEnemies(e, e.pos.x, e.pos.y + vy) && !isInsideSafeZone(e.pos.x, e.pos.y + vy)) {
                                e.pos.y += vy;
                                moved = true;
                            }
                            if (!moved) {
                                const strafeVx = -ndy * moveSpeed;
                                const strafeVy = ndx * moveSpeed;
                                if (isPositionValid(state, e.pos.x + strafeVx, e.pos.y + strafeVy, e.radius) && !isCollidingWithPlayer(e.pos.x + strafeVx, e.pos.y + strafeVy, e.radius) && !isCollidingWithEnemies(e, e.pos.x + strafeVx, e.pos.y + strafeVy) && !isInsideSafeZone(e.pos.x + strafeVx, e.pos.y + strafeVy)) {
                                    e.pos.x += strafeVx;
                                    e.pos.y += strafeVy;
                                } else {
                                    const strafeVx2 = ndy * moveSpeed;
                                    const strafeVy2 = -ndx * moveSpeed;
                                    if (isPositionValid(state, e.pos.x + strafeVx2, e.pos.y + strafeVy2, e.radius) && !isCollidingWithPlayer(e.pos.x + strafeVx2, e.pos.y + strafeVy2, e.radius) && !isCollidingWithEnemies(e, e.pos.x + strafeVx2, e.pos.y + strafeVy2) && !isInsideSafeZone(e.pos.x + strafeVx2, e.pos.y + strafeVy2)) {
                                        e.pos.x += strafeVx2;
                                        e.pos.y += strafeVy2;
                                    }
                                }
                            }
                        }
                    }
                }
            }

        } else {
            // --- PATROL LOGIC ---
            if (e.patrolTimer > 0) {
                e.patrolTimer--;
            } else {
                // Pick a target if none
                if (!e.patrolTarget) {
                    // Random point within 5 units of spawn
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 5;
                    e.patrolTarget = {
                        x: e.spawnPos.x + Math.cos(angle) * dist,
                        y: e.spawnPos.y + Math.sin(angle) * dist
                    };
                }

                // Move towards patrol target
                const dx = e.patrolTarget.x - e.pos.x;
                const dy = e.patrolTarget.y - e.pos.y;
                const distToTarget = Math.sqrt(dx * dx + dy * dy);

                if (distToTarget < 0.2) {
                    // Arrived
                    e.patrolTarget = null;
                    e.patrolTimer = 60 + Math.random() * 120; // Wait 1-3 seconds
                } else {
                    const moveSpeed = speed * 0.015; // Patrol is slower (50% speed)
                    const ndx = dx / distToTarget;
                    const ndy = dy / distToTarget;

                    const nextX = e.pos.x + ndx * moveSpeed;
                    const nextY = e.pos.y + ndy * moveSpeed;

                    if (isPositionValid(state, nextX, nextY, e.radius) && !isInsideSafeZone(nextX, nextY)) {
                        e.pos.x = nextX;
                        e.pos.y = nextY;
                    } else {
                        // Blocked? Reset target
                        e.patrolTarget = null;
                        e.patrolTimer = 30;
                    }
                }
            }
        }
    });

    // Loot Pickup (Grid Logic & Vacuum XP)
    state.loot.forEach(l => {
        l.life--;
        if (l.life <= 0) l.isDead = true;
        let pickupDist = l.radius + state.player.radius + 0.5;

        // Multi-Phase XP Orb Physics
        if (l.type === 'xp_orb' && l.xpProps) {
            const props = l.xpProps;

            // Phase 1: Dropping (Arcing to ground)
            // We'll fake a 30-frame ease-out drop
            if (props.state === 'DROPPING') {
                props.timer++;
                const duration = 20;
                const t = Math.min(props.timer / duration, 1.0);

                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - t, 3);

                const dx = props.targetGround.x - props.startPos.x;
                const dy = props.targetGround.y - props.startPos.y;

                l.pos.x = props.startPos.x + dx * easeOut;
                l.pos.y = props.startPos.y + dy * easeOut;

                if (t >= 1.0) {
                    props.state = 'IDLE';
                    props.timer = 0;
                }
            }
            // Phase 2: Idle (Wait before vacuum)
            else if (props.state === 'IDLE') {
                props.timer++;
                // Wait for 15 frames (~0.25s) before allowing vacuum
                // Unless player is VERY close, maybe skip wait? No, let's keep the pop-feel.
                if (props.timer > 15) {
                    props.state = 'VACUUM';
                    props.vacuumSpeed = 0.1; // Start slow
                }
            }
            // Phase 3: Vacuum (Accelerate to player)
            else if (props.state === 'VACUUM') {
                const targetY = state.player.pos.y - 0.5; // Chest height
                const dx = state.player.pos.x - l.pos.x;
                const dy = targetY - l.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Accelerate
                props.vacuumSpeed += 0.02;
                // Cap speed slightly above player speed (player is ~0.15-0.3 depending on stats)
                // Let's cap at 0.6 to ensure catch up
                if (props.vacuumSpeed > 0.6) props.vacuumSpeed = 0.6;

                if (dist > props.vacuumSpeed) {
                    l.pos.x += (dx / dist) * props.vacuumSpeed;
                    l.pos.y += (dy / dist) * props.vacuumSpeed;
                } else {
                    l.pos.x = state.player.pos.x;
                    l.pos.y = targetY;
                }

                if (dist < 0.5) {
                    l.isDead = true;
                    state.player.xp += (l.value || 0);
                    callbacks.checkLevelUp(state.player);

                    // Glow Effect
                    callbacks.createImpactPuff({ x: l.pos.x, y: l.pos.y }, SpellType.ARCANE_EXPLOSION);
                    // We reuse ARCANE type for purple/pink puff, usually looks magical.
                    // Or we could add a specific NOVA effect if needed, but impact puff is good.
                }
            }
        }
        else if (l.type === 'coin') {
            const dist = getDistance(l.pos, state.player.pos);
            if (dist < 4) {
                const dir = normalize({ x: state.player.pos.x - l.pos.x, y: state.player.pos.y - l.pos.y });
                l.pos.x += dir.x * 0.2;
                l.pos.y += dir.y * 0.2;
            }
        }

        // Standard Pickup Check (Coins/Items/Bombs)
        if (l.type !== 'xp_orb') {
            const dist = getDistance(l.pos, state.player.pos);
            if (dist < pickupDist) {

                if (l.type === 'bomb') {
                    state.player.bombAmmo += 1;
                    callbacks.addFloatingText("+1 💣", state.player.pos, '#fff');
                    l.isDead = true;
                } else if (l.type === 'equipment' && l.data) {
                    // Find grid spot
                    const inv = state.player.inventory;
                    let placed = false;

                    // Naive strategy: scan slots from top-left
                    for (let y = 0; y <= INVENTORY_GRID_H - l.data.h; y++) {
                        for (let x = 0; x <= INVENTORY_GRID_W - l.data.w; x++) {
                            // Collision check
                            let collision = false;
                            for (const item of inv) {
                                if (item.gridX !== undefined && item.gridY !== undefined) {
                                    if (x < item.gridX + item.w && x + l.data.w > item.gridX &&
                                        y < item.gridY + item.h && y + l.data.h > item.gridY) {
                                        collision = true;
                                        break;
                                    }
                                }
                            }
                            if (!collision) {
                                l.data.gridX = x;
                                l.data.gridY = y;
                                inv.push(l.data);
                                placed = true;
                                break;
                            }
                        }
                        if (placed) break;
                    }

                    if (placed) {
                        l.isDead = true;
                        callbacks.addFloatingText(l.data.name, state.player.pos, RARITY_COLORS[l.data.rarity]);
                    } else {
                        // Inventory Full - do not pick up
                    }

                } else if (l.type === 'coin') {
                    const val = l.value || 1;
                    state.player.coins += val;
                    if (state.activeQuest.type === 'collect') {
                        state.activeQuest.current += val;
                    }
                    l.isDead = true;
                }
            }
        }
    });

    // Projectile vs Enemy collisions
    state.projectiles.forEach(p => {
        if (p.isDead || p.spellType === SpellType.BOMB) return;
        if (p.data?.skipCollision || p.data?.isVisual) return; // Optimization
        const config = SPELL_REGISTRY[p.spellType];

        if (!p.isEnemy) {
            state.enemies.forEach(e => {
                if (e.isDead || p.isDead) return;
                if (p.spellType === SpellType.ICE && p.hitList.includes(e.id)) return;

                // Use ellipse hitbox when provided. We expand the hitbox by projectile radius for a quick circle-vs-ellipse test.
                let collided = false;
                if (e.hitbox) {
                    const ellipse = {
                        cx: e.pos.x + (e.hitbox.offsetX || 0),
                        cy: e.pos.y + (e.hitbox.offsetY || 0),
                        rx: e.hitbox.rx + (p.radius || 0),
                        ry: e.hitbox.ry + (p.radius || 0),
                        rotation: e.hitbox.rotation || 0
                    };
                    if (pointInEllipse(p.pos, ellipse)) collided = true;
                }

                // Fallback / quick check using circular radii (keeps legacy behavior if no hitbox)
                if (!collided) {
                    const dist = getDistance(p.pos, e.pos);
                    if (dist < (p.radius + e.radius)) collided = true;
                }

                if (collided) {

                    const config = SPELL_REGISTRY[p.spellType];
                    const behaviorKey = config?.behaviorKey || 'GenericBehavior';
                    const behavior = BEHAVIOR_REGISTRY[behaviorKey];

                    if (behavior?.onHit) {
                        behavior.onHit(state, p, e, callbacks);
                    }

                    // Fallback for non-migrated (or behavior.onHit undefined)
                    if (!behavior?.onHit) {
                        e.hp -= p.damage;
                        callbacks.addFloatingText(`${Math.round(p.damage)}`, e.pos, config.color);
                        callbacks.createImpactPuff(e.pos, p.spellType);
                        soundSystem.playEnemyHit(); // Sound trigger
                    }


                    e.isFrozen = true;
                    e.freezeTimer = config.slowDuration || 60;
                    if (state.player.level >= LEVEL_5_UNLOCK) p.hitList.push(e.id);
                    else p.isDead = true;
                }


                else if (p.spellType === SpellType.WIND || p.spellType === SpellType.EARTH) {
                    p.isDead = true;
                    const kbForce = p.knockback || 1.5;
                    const kbDir = normalize({ x: e.pos.x - p.pos.x, y: e.pos.y - p.pos.y });

                    // Physics Knockback applied to velocity now
                    e.velocity.x += kbDir.x * kbForce;
                    e.velocity.y += kbDir.y * kbForce;

                    if (p.spellType === SpellType.EARTH) callbacks.addFloatingText("SLAM!", e.pos, '#8b4513');
                    else callbacks.addFloatingText(">>>", e.pos, '#a7f3d0');
                }
                else if (p.spellType === SpellType.ACID_SPIT) {
                    // Normally this is Enemy -> Player, but for completeness or if player reflects
                    p.isDead = true;
                }

                if (e.hp <= 0) {
                    e.isDead = true;
                    handleEnemyDeath(state, e, callbacks);
                }
            });
        } else {
            const dist = getDistance(p.pos, state.player.pos);
            if (dist < (p.radius + state.player.radius)) {
                takePlayerDamage(state, p.damage, callbacks);
                p.isDead = true;
            }
        }
    });
};
