import { GameState, Vector2, Loot, Player } from '../../types';
import { LOOT_PHYSICS, RARITY_COLORS } from '../../constants';
import { getDistance, normalize } from '../../utils/isometric';

export const spawnLoot = (state: GameState, pos: Vector2, items: Partial<Loot>[]) => {
    items.forEach(itemConfig => {
        // Gentle Drop Logic (User Requested)
        // Small random offset to prevent perfect stacking, but mostly stationary
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.02 + Math.random() * 0.03; // Very slight spread

        const loot: Loot = {
            id: `loot_${Date.now()}_${Math.random()}`,
            pos: { ...pos },
            velocity: { x: 0, y: 0 },
            radius: 0.3,
            isDead: false,
            type: itemConfig.type || 'coin',
            value: itemConfig.value || 0,
            life: 3600,
            rarity: itemConfig.rarity || 'common',
            labelVisible: false,
            physics: {
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                z: 0.2, // Start slightly off ground
                vz: 1.5 + (Math.random() * 1.0), // Small hop, not a pop
                isGrounded: false
            },
            renderPos: { ...pos },
            data: itemConfig.data,
            // Custom properties for vacuum
            vacuumDelay: 40, // Frames to wait before vacuuming (allows physics to play out)
            vacuumTime: 0,   // How long we've been vacuuming (for acceleration)
            ...itemConfig
        } as Loot & { vacuumDelay: number, vacuumTime: number };

        state.loot.push(loot);
    });
};

export const spawnXpOrb = (state: GameState, pos: Vector2, value: number) => {
    // Gentle Drop Logic matching Coins
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.02 + Math.random() * 0.03;

    const loot: Loot = {
        id: `xp_${Date.now()}_${Math.random()}`,
        pos: { ...pos },
        velocity: { x: 0, y: 0 },
        radius: 0.25,
        isDead: false,
        type: 'xp_orb',
        value: value,
        life: 3600,
        rarity: 'common',
        labelVisible: false,
        physics: {
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            },
            z: 0.4,
            vz: 1.2 + (Math.random() * 0.5),
            isGrounded: false
        },
        renderPos: { ...pos },
        data: undefined,
        vacuumDelay: 40,
        vacuumTime: 0
    } as Loot & { vacuumDelay: number, vacuumTime: number };

    state.loot.push(loot);
};

export const updateLoot = (state: GameState, dt: number, callbacks: any) => {
    const player = state.player;
    const playerDistLimit = LOOT_PHYSICS.VACUUM_RANGE;

    for (const item of state.loot) {
        if (item.isDead) continue;

        // Cast to our extended type safely
        const lootItem = item as Loot & { vacuumDelay: number, vacuumTime: number };
        if (lootItem.vacuumDelay === undefined) { lootItem.vacuumDelay = 0; lootItem.vacuumTime = 0; }

        // Decrement Delay
        if (lootItem.vacuumDelay > 0) lootItem.vacuumDelay--;

        // --- 1. PHYSICS (Gravity / Bounce) ---
        // Only apply physics if NOT vacuuming (or if delay is active)
        const isVacuuming = lootItem.vacuumTime > 0;

        if (!lootItem.physics) {
            // Safety: Initialize default physics if missing to prevent crash
            lootItem.physics = {
                velocity: { x: 0, y: 0 },
                z: 0,
                vz: 0,
                isGrounded: true
            };
        }

        if (!lootItem.renderPos) {
            // Safety: Initialize renderPos if missing
            lootItem.renderPos = { ...lootItem.pos };
        }

        if (!lootItem.physics.isGrounded && !isVacuuming) {
            // Apply Gravity
            lootItem.physics.vz -= LOOT_PHYSICS.GRAVITY;
            lootItem.physics.z += lootItem.physics.vz;

            // Apply Horizontal Spread
            lootItem.pos.x += lootItem.physics.velocity.x;
            lootItem.pos.y += lootItem.physics.velocity.y;

            // Ground Collision
            if (lootItem.physics.z <= 0) {
                lootItem.physics.z = 0;
                // Bounce
                lootItem.physics.vz *= -LOOT_PHYSICS.BOUNCE_FACTOR;

                // Friction
                lootItem.physics.velocity.x *= 0.8;
                lootItem.physics.velocity.y *= 0.8;

                // Stop bouncing if too slow
                if (Math.abs(lootItem.physics.vz) < 1.0) {
                    lootItem.physics.isGrounded = true;
                    lootItem.physics.vz = 0;
                    lootItem.physics.velocity = { x: 0, y: 0 };
                }
            }
        }

        // --- 2. VACUUM LOGIC ---
        // Conditions: 
        // 1. Must be XP (Global) or Coin (Close)
        // 2. Must be settled (or delay over)
        // 3. Must not be "dead" logic

        const isXp = lootItem.type === 'xp_orb';
        const isCoin = lootItem.type === 'coin';

        if ((isXp || isCoin) && lootItem.vacuumDelay <= 0) {
            const dist = getDistance(lootItem.pos, player.pos);
            let startVacuum = false;

            if (isXp) {
                // Global Range for XP, but wait for ground?
                // User said: "hit the ground first, then wait to suck"
                // The vacuumDelay covers the "wait" time.
                // We also check isGrounded to be sure it actually hit ground.
                if (lootItem.physics.isGrounded || lootItem.vacuumDelay <= -20) {
                    startVacuum = true;
                    // Fallback: if it never grounds (glitch), force vacuum after extra delay
                }
            } else if (isCoin) {
                // Proximity only
                if (dist < playerDistLimit) startVacuum = true;
            }

            if (startVacuum) {
                lootItem.vacuumTime++;

                // Calculate Acceleration
                // "slowly start to travel, and speed up as gets closer"
                // Speed based on vacuumTime
                const t = Math.min(lootItem.vacuumTime / 60, 2.0); // Cap at 2 seconds ramp
                const accel = t * t; // Quadratic accel

                let currentSpeed = LOOT_PHYSICS.VACUUM_SPEED + (accel * 0.5);

                // Boost speed if very close to prevent orbiting
                if (dist < 1.0) currentSpeed *= 2;

                const dx = player.pos.x - lootItem.pos.x;
                const dy = player.pos.y - lootItem.pos.y;
                const norm = Math.sqrt(dx * dx + dy * dy);

                if (norm > 0) {
                    lootItem.pos.x += (dx / norm) * currentSpeed;
                    lootItem.pos.y += (dy / norm) * currentSpeed;
                }

                // Lift off ground visually when vacuuming
                if (lootItem.physics.z < 1.0) lootItem.physics.z += 0.1;

                // Collection
                if (dist < 0.5) {
                    collectItem(state, lootItem, callbacks);
                }
            }
        }

        // Update Render Pos
        item.renderPos.x = item.pos.x;
        item.renderPos.y = item.pos.y;

        // Decay Life
        item.life--;
        if (item.life <= 0 && !isXp && !isCoin) item.isDead = true;
    }
};

const collectItem = (state: GameState, item: Loot, callbacks: any) => {
    item.isDead = true;

    if (item.type === 'coin') {
        state.player.coins += (item.value || 1);
        if (callbacks.addFloatingText) {
            callbacks.addFloatingText(`+${item.value} Coins`, item.pos, '#fbbf24');
        }
    } else if (item.type === 'xp_orb') {
        state.player.xp += (item.value || 10);

        // XP Tally Logic
        state.player.xpTally = (state.player.xpTally || 0) + (item.value || 10);
        state.player.xpTimer = 180; // Keep tally up for 3 seconds
        state.player.xpGlowTimer = 30; // Flash purple

        callbacks.checkLevelUp(state.player);
        // Removed individual floating text to support tally system
    } else if (item.type === 'equipment' || item.type === 'potion') {
        if (item.data) {
            callbacks.addFloatingText(`${item.data.name}`, item.pos, RARITY_COLORS[item.rarity]);
            state.player.inventory.push(item.data);
        }
    }
};

export const tryPickupLoot = (state: GameState, mouseWorldPos: Vector2, callbacks: any) => {
    for (const item of state.loot) {
        if (item.isDead) continue;
        const dist = getDistance(mouseWorldPos, item.pos);
        if (dist < 0.8) {
            collectItem(state, item, callbacks);
            return true;
        }
    }
    return false;
};
