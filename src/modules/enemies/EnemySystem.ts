import { GameState, Enemy, Vector2 } from '../../types';
import { enemiesCollide, calculateEnemyHitboxes, ScreenRect, rectOverlap } from '../../utils/hitboxUtils';
import { toScreen } from '../../utils/isometric';
import { spawnLoot } from '../loot/LootSystem';
import { generateLootItem } from '../items/ItemGenerator';
import { COIN_VALUE_RANGE, BOSS_CONFIG, ANT_CONFIG, GOLEM_CONFIG, SPITTER_CONFIG } from '../../constants';

export const SPAWN_RADIUS = 15; // tiles

export const spawnEnemy = (state: GameState, pos: Vector2, aiState: 'IDLE' | 'PATROL' | 'CHASE' = 'IDLE', patrolRange: number = 5): Enemy => {
    const id = `enemy_${Date.now()}_${Math.random()}`;
    const newEnemy: Enemy = {
        id,
        pos,
        velocity: { x: 0, y: 0 },
        radius: 0.5,
        isDead: false,
        hp: 100,
        maxHp: 100,
        speed: 1.5, // slightly slower than player
        damage: 10,
        xpValue: 10,
        coinValue: Math.floor(Math.random() * (COIN_VALUE_RANGE.max - COIN_VALUE_RANGE.min + 1)) + COIN_VALUE_RANGE.min,
        isFrozen: false,
        freezeTimer: 0,
        type: 'melee',
        isElite: false,
        facingRight: true,
        attackCooldown: 0,
        isAttacking: false,
        attackStartTime: 0,
        nextAttackTime: 0,
        didDamage: false,
        isPhasing: false,
        phaseTimer: 0,
        burnTimer: 0,
        burnDamage: 0,
        spawnPos: { ...pos },
        aiState: aiState,
        patrolTarget: null,
        patrolTimer: 0,
        patrolRange: patrolRange,
        hitTimer: 0,
        enemyState: 'ALIVE',
        deathTimer: 0,
        shockTimer: 0
    };
    state.enemies.push(newEnemy);
    return newEnemy;
};

export const updateEnemies = (state: GameState, dt: number, callbacks?: any) => {
    const player = state.player;

    // Simple Boid/Chase Logic
    for (const enemy of state.enemies) {
        if (enemy.isDead) continue;

        // Hit Flash Timer
        if (enemy.hitTimer > 0) enemy.hitTimer--;
        if (enemy.freezeTimer > 0) enemy.freezeTimer--;

        // Burn / Ignite Logic
        if (enemy.burnTimer > 0) {
            enemy.burnTimer--;
            // Frequency optimized: Tick every 36 frames (180 frames / 5 ticks)
            if (enemy.burnTimer % 36 === 0) {
                // Tick for burnDamage
                const dmg = enemy.burnDamage || 1;
                enemy.hp -= dmg;
                enemy.hitTimer = 2; // Small flash on tick

                // Pop floating text
                if (callbacks && callbacks.addFloatingText) {
                    callbacks.addFloatingText(`${Math.round(dmg)}`, enemy.pos, '#ff4500'); // Orange
                }

                // If enemy dies from burn
                if (enemy.hp <= 0 && enemy.enemyState !== 'DYING') {
                    // Start death immediately
                    // Note: Credits/XP won't trigger here without callbacks, 
                    // but usually player hits them again or checks in logic.
                    // Ideally pass callbacks to UpdateEnemies or check death outside.
                    enemy.enemyState = 'DYING';
                    enemy.deathTimer = 30;

                    // SPAWN LOOT (Burn Death)
                    spawnLoot(state, enemy.pos, [
                        { type: 'xp_orb', value: enemy.xpValue },
                        { type: 'coin', value: enemy.coinValue }
                    ]);
                    if (callbacks && callbacks.onEnemyDeath) callbacks.onEnemyDeath(enemy);
                }
            }
        }

        // Generic Death Check (for non-burn damage)
        if (enemy.hp <= 0 && enemy.enemyState !== 'DYING') {
            enemy.enemyState = 'DYING';
            enemy.deathTimer = 30; // Standard death duration

            // Trigger Death Callback
            if (callbacks && callbacks.onEnemyDeath) callbacks.onEnemyDeath(enemy);

            // Spawn Loot
            // Spawn Loot
            const drops: any[] = [
                { type: 'xp_orb', value: enemy.xpValue || 10 },
                { type: 'coin', value: enemy.coinValue || 1 }
            ];

            // 20% Chance for Equipment
            if (Math.random() < 0.20) {
                // Generate Item
                // Using player level? We don't have it here easily, effectively using Enemy Level scaling proxy
                // Assuming Level 1 for now or we pass logic.
                // Let's pass a generic level based on enemy strength or just 1.
                const item = generateLootItem(1, 'weapon'); // Biased to weapons for testing
                drops.push({ type: 'equipment', data: item, rarity: item.rarity });
            }

            spawnLoot(state, enemy.pos, drops);
        }

        // Death Animation Limit
        if (enemy.enemyState === 'DYING') {
            // Apply simple physics during death (fall back)
            if (enemy.deathTimer === 45) { // Start of death
                // No more flying away
            }

            enemy.deathTimer--;
            if (enemy.deathTimer <= 0) {
                enemy.isDead = true;
            }
            // Continue to process physics for the "fall"
        }

        // --- PHYSICS (Knockback) ---
        // Apply velocity (Knockback)
        if (Math.abs(enemy.velocity.x) > 0.01 || Math.abs(enemy.velocity.y) > 0.01) {
            enemy.pos.x += enemy.velocity.x;
            enemy.pos.y += enemy.velocity.y;

            // Friction
            enemy.velocity.x *= 0.85;
            enemy.velocity.y *= 0.85;
        }

        // --- AI ---

        // If Knocked back hard, disable AI control briefly
        const speedSq = enemy.velocity.x * enemy.velocity.x + enemy.velocity.y * enemy.velocity.y;
        if (speedSq > 0.1) continue;

        if (enemy.aiState === 'IDLE') {
            // Do nothing
            continue;
        }

        if (enemy.aiState === 'PATROL') {
            if (enemy.patrolTimer > 0) {
                enemy.patrolTimer--;
                continue;
            }

            if (!enemy.patrolTarget) {
                // Pick new random point near spawn
                const range = enemy.patrolRange || 5;
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * range;
                enemy.patrolTarget = {
                    x: enemy.spawnPos.x + Math.cos(angle) * dist,
                    y: enemy.spawnPos.y + Math.sin(angle) * dist
                };
            }

            const dx = enemy.patrolTarget.x - enemy.pos.x;
            const dy = enemy.patrolTarget.y - enemy.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Face target
            enemy.facingRight = dx > 0;

            if (dist < 0.2) {
                // Reached target
                enemy.patrolTarget = null;
                enemy.patrolTimer = 60 + Math.random() * 60; // Wait 1-2s
            } else {
                // Move logic
                let baseSpeed = enemy.speed * 0.5;
                if (enemy.freezeTimer > 0) baseSpeed *= 0.5;

                const speed = baseSpeed * (dt / 1000);
                enemy.pos.x += (dx / dist) * speed;
                enemy.pos.y += (dy / dist) * speed;
            }
            continue;
        }

        if (enemy.aiState === 'CHASE') {
            // Face Player
            if (player.pos.x > enemy.pos.x) enemy.facingRight = true;
            else enemy.facingRight = false;

            // Chase
            const dx = player.pos.x - enemy.pos.x;
            const dy = player.pos.y - enemy.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0.8) { // Stop if touching
                let currentSpeed = enemy.speed;
                if (enemy.freezeTimer > 0) currentSpeed *= 0.5;

                const speed = currentSpeed * (dt / 1000);
                enemy.pos.x += (dx / dist) * speed;
                enemy.pos.y += (dy / dist) * speed;
            }
        }
    }

    // --- GLOBAL COLLISION RESOLUTION ---
    // Prevent enemies from overlapping (Hard Collisions)
    const iterations = 2; // Run twice for stability
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < state.enemies.length; i++) {
            const e1 = state.enemies[i];
            if (e1.isDead) continue;

            // Player vs Enemy Collision (using detailed hitboxes)
            const enemyHitboxes = calculateEnemyHitboxes(e1);
            const playerScreen = toScreen(player.pos.x, player.pos.y);

            // Player hitbox (approximate body size)
            const playerHitbox: ScreenRect = {
                x: playerScreen.x,
                y: playerScreen.y - 40,  // Center of player sprite
                w: 28,
                h: 70  // Player height
            };

            // Check if player collides with enemy's main body hitbox
            if (rectOverlap(playerHitbox, enemyHitboxes.body)) {
                // Calculate push direction in world space
                const pdx = player.pos.x - e1.pos.x;
                const pdy = player.pos.y - e1.pos.y;
                const pDistSq = pdx * pdx + pdy * pdy;

                if (pDistSq > 0.0001) {
                    const pDist = Math.sqrt(pDistSq);
                    const pnx = pdx / pDist;
                    const pny = pdy / pDist;

                    // Push apart with fixed force
                    const pushForce = 0.08;
                    player.pos.x += pnx * pushForce;
                    player.pos.y += pny * pushForce;
                    e1.pos.x -= pnx * pushForce;
                    e1.pos.y -= pny * pushForce;
                }
            }

            for (let j = i + 1; j < state.enemies.length; j++) {
                const e2 = state.enemies[j];
                if (e2.isDead) continue;

                // Use detailed hitbox collision detection
                if (enemiesCollide(e1, e2)) {
                    // Calculate push direction from centers
                    const dx = e1.pos.x - e2.pos.x;
                    const dy = e1.pos.y - e2.pos.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq > 0.0001) {
                        const dist = Math.sqrt(distSq);
                        const nx = dx / dist;
                        const ny = dy / dist;

                        // Push apart with fixed force
                        const pushForce = 0.05;
                        e1.pos.x += nx * pushForce;
                        e1.pos.y += ny * pushForce;
                        e2.pos.x -= nx * pushForce;
                        e2.pos.y -= ny * pushForce;
                    }
                }
            }
        }
    }
};
