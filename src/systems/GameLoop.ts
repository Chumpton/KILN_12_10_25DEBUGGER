
import { GameState, Vector2, EquipmentItem, Quest, SpellType, MeleeAttackPhase } from '../types';
import { MOUNT_SPEED_MULT, POTION_CONFIG, CLASS_CONFIG, BASE_STAT_CONFIG, QUEST_CONFIG, ROLL_SPEED_MULT, ROLL_DURATION, ROLL_COOLDOWN, SPAWN_INTERVAL_START, SPAWN_INTERVAL_MIN, DEBUG_MODE } from '../constants';
import { spawnEnemy } from './SpawnSystem';
import { updatePhysics, isPositionValid } from './PhysicsSystem';
import { initiateCast, updateCasting, updateAreaEffects, SpellCallbacks } from '../modules/spells/SpellSystem';
import { cleanDeadEntities } from './EntityManager';
import { InputSystem } from './InputSystem';
import { toWorld, getDistance, normalize, toScreen } from '../utils/isometric';
import { soundSystem } from './SoundSystem';
import { WEAPON_REGISTRY } from '../data/WeaponRegistry';
import { performWeaponAttack, updateWeaponSystem } from './WeaponSystem';
import { updateLoot, tryPickupLoot } from '../modules/loot/LootSystem';

export interface GameLoopCallbacks extends SpellCallbacks {
    createSparkleBurst: (pos: Vector2) => void;
}

const generateQuest = (completed: number): Quest => {
    const type = Math.random() > 0.5 ? 'kill' : 'collect';
    const scale = 1 + (completed * 0.2);

    if (type === 'kill') {
        const target = Math.ceil(QUEST_CONFIG.baseKillTarget * scale);
        return {
            id: `quest_${Date.now()}`,
            type: 'kill',
            description: `Kill ${target} Enemies`,
            target: target,
            current: 0,
            rewardXp: Math.ceil(QUEST_CONFIG.baseRewardXp * scale),
            rewardCoins: Math.ceil(QUEST_CONFIG.baseRewardCoins * scale)
        };
    } else {
        const target = Math.ceil(QUEST_CONFIG.baseCollectTarget * scale);
        return {
            id: `quest_${Date.now()}`,
            type: 'collect',
            description: `Collect ${target} Coins`,
            target: target,
            current: 0,
            rewardXp: Math.ceil(QUEST_CONFIG.baseRewardXp * scale),
            rewardCoins: Math.ceil(QUEST_CONFIG.baseRewardCoins * scale)
        };
    }
};

// Debug Timing State
let lastLogTime = 0;
let frameCount = 0;
let totalUpdateTime = 0;

export const updateGame = (
    state: GameState,
    inputSystem: InputSystem,
    moveTargetRef: { current: Vector2 | null },
    spawnTimerRef: { current: number },
    cooldownRef: { current: number },
    callbacks: GameLoopCallbacks,
    canvas: HTMLCanvasElement,
    sessionTime: number
) => {
    const start = performance.now();

    // --- SYSTEM UPDATES ---
    // Bird Ambience
    if (Math.random() < 0.005) {
        soundSystem.playBirdSound();
    }

    // SAFETY: Initialize Attack State if missing (Migration for old saves)
    if (!state.player.attack) {
        state.player.attack = {
            isAttacking: false,
            weaponId: null,
            timer: 0,
            duration: 0,
            cooldown: 0,
            comboCount: 0,
            targetPos: { x: 0, y: 0 },
            hitTargets: [],
            phase: MeleeAttackPhase.IDLE,
            comboWindowOpen: false,
            inputBuffer: false
        };
    }

    // Quest Check
    if (state.activeQuest.current >= state.activeQuest.target) {
        callbacks.addFloatingText("QUEST COMPLETE!", state.player.pos, '#fbbf24');
        callbacks.addFloatingText(`+${state.activeQuest.rewardXp} XP`, { x: state.player.pos.x, y: state.player.pos.y - 1 }, '#fbbf24');
        callbacks.addFloatingText(`+${state.activeQuest.rewardCoins} Coins`, { x: state.player.pos.x, y: state.player.pos.y - 1.5 }, '#fbbf24');
        state.player.xp += state.activeQuest.rewardXp;
        callbacks.checkLevelUp(state.player);
        state.player.coins += state.activeQuest.rewardCoins;
        state.questsCompleted++;
        state.activeQuest = generateQuest(state.questsCompleted);
    }

    // Difficulty & Spawning
    const minutes = (sessionTime / 1000) / 60;
    const difficultyFactor = 1 + (minutes * 0.2);
    spawnTimerRef.current++;
    const currentSpawnInterval = Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_START / difficultyFactor);
    if (spawnTimerRef.current >= currentSpawnInterval) {
        spawnEnemy(state, difficultyFactor, callbacks);
        spawnTimerRef.current = 0;
    }

    // Helper: Timers
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const playerScreen = toScreen(state.player.pos.x, state.player.pos.y);
    const offsetX = centerX - playerScreen.x;
    const offsetY = centerY - playerScreen.y;
    const mouseWorld = toWorld(inputSystem.mouseScreen.x - offsetX, inputSystem.mouseScreen.y - offsetY);

    if (cooldownRef.current > 0) cooldownRef.current--;
    if (state.player.roll.cooldown > 0) state.player.roll.cooldown--;
    updateCasting(state.player, state, callbacks, cooldownRef, mouseWorld, undefined, inputSystem);
    updateWeaponSystem(state, callbacks, mouseWorld);
    updateLoot(state, 16.66, callbacks); // NEW: Update Loot Physics/Vacuum
    updateAreaEffects(state, 1.0, callbacks); // NEW: Update Portals/AoE

    // --- STATE MACHINE PRIORITY ---
    // 0. WORLD EDITOR MODE (Complete Lockout)
    if (state.isWorldEditorActive) {
        // Block all movement, casting, and combat
        moveTargetRef.current = null;
        updatePhysics(state, { leftMouseDown: false }, moveTargetRef, callbacks);
        cleanDeadEntities(state);
        return; // Skip all other game logic
    }

    // 1. ROLLING (Total Lockout)

    if (state.player.roll.isRolling) {
        state.player.roll.timer--;
        if (state.player.roll.timer <= 0) state.player.roll.isRolling = false;

        // Apply Roll Movement
        if (state.player.roll.dir) {
            const rollPixelSpeed = state.player.speed * ROLL_SPEED_MULT;
            const rollWorldSpeed = toWorld(rollPixelSpeed, 0).x * 2;



            if (DEBUG_MODE) {
                console.log('Rolling:', { dir: state.player.roll.dir, speed: rollWorldSpeed, pix: rollPixelSpeed, pos: state.player.pos });
            }

            const nextX = state.player.pos.x + state.player.roll.dir.x * rollWorldSpeed;
            const nextY = state.player.pos.y + state.player.roll.dir.y * rollWorldSpeed;

            if (isPositionValid(state, nextX, state.player.pos.y, state.player.radius)) {
                state.player.pos.x = nextX;
            } else {
                if (DEBUG_MODE) console.log('Roll Blocked X', nextX, state.player.pos.y);
            }
            if (isPositionValid(state, state.player.pos.x, nextY, state.player.radius)) {
                state.player.pos.y = nextY;
            } else {
                if (DEBUG_MODE) console.log('Roll Blocked Y', state.player.pos.x, nextY);
            }
        }

        updatePhysics(state, { leftMouseDown: false }, moveTargetRef, callbacks);
        cleanDeadEntities(state);
    } else {

        // 2. CASTING / ATTACKING LOCKOUT
        const isCasting = state.player.casting.isCasting;
        const isAttacking = state.player.attack.isAttacking;

        // Block Movement if conducting specific actions
        // Only allow movement for specific mobile spells (sword swipes, whirlwind)
        // Fireball and other projectile spells should lock movement
        const isMobileAction = (isCasting && (
            state.player.casting.currentSpell === SpellType.SWORD_SWIPE ||
            state.player.casting.currentSpell === SpellType.WHIRLWIND_STRIKE
        )) || isAttacking; // Allow movement during weapon swing

        if ((isCasting || isAttacking) && !isMobileAction) {
            moveTargetRef.current = null;
            updatePhysics(state, { leftMouseDown: false }, moveTargetRef, callbacks);
            cleanDeadEntities(state);
        } else {
            // 3. INPUT HANDLING (Idle / Mobile Cast)

            // RIGHT CLICK: Cast Selected Spell
            if (inputSystem.rightMouseDown) {
                state.player.roll.isRolling = false; // Cancel roll if trying to cast? No, roll locks out.
                // Continuous Cast Logic
                const spell = state.player.currentSpell;

                // Stop movement to cast (unless mobile cast)
                // Only SWORD_SWIPE and WHIRLWIND_STRIKE are mobile
                const isMobile = spell === SpellType.SWORD_SWIPE || spell === SpellType.WHIRLWIND_STRIKE;
                if (!isMobile) {
                    moveTargetRef.current = null;
                }

                initiateCast(state, mouseWorld, spell, cooldownRef, callbacks, true, moveTargetRef);
            }

            // SPACE: Roll
            if (inputSystem.keys.has(' ') && state.player.roll.cooldown <= 0 && !state.player.roll.isRolling && !state.player.casting.isCasting) {
                state.player.roll.isRolling = true;
                state.player.roll.timer = ROLL_DURATION;
                state.player.roll.cooldown = ROLL_COOLDOWN;

                // Roll towards mouse
                const dx = mouseWorld.x - state.player.pos.x;
                const dy = mouseWorld.y - state.player.pos.y;
                state.player.roll.dir = normalize({ x: dx, y: dy });

                moveTargetRef.current = null; // Cancel pathing
            }

            // LEFT CLICK: Attack / Move
            if (inputSystem.leftMouseDown) {
                // Prioritize: Helper to find enemy near mouse even if imprecise
                const clickedEnemyId = inputSystem.getClickedEnemyScreen(state, inputSystem.mouseScreen, { x: offsetX, y: offsetY });

                // If we clicked an enemy, OR we are holding Shift, OR we are right-clicking (which implies combat mode)?
                // User wants "Left click isn't swinging...". 
                // Let's act like Shift is held if we are very close to the enemy?

                if (clickedEnemyId) {
                    const enemy = state.enemies.find(e => e.id === clickedEnemyId);
                    if (enemy) {
                        state.player.lockedTargetId = clickedEnemyId;
                        const dist = getDistance(state.player.pos, enemy.pos);
                        // Weapon Range (could be dynamic based on weapon)
                        const range = 2.5;

                        if (inputSystem.keys.has('shift') || dist <= range) {
                            moveTargetRef.current = null;
                            // NEW: Use separate Weapon System
                            performWeaponAttack(state, mouseWorld, callbacks);
                        } else {
                            moveTargetRef.current = { ...enemy.pos };
                        }
                    }
                } else if (inputSystem.keys.has('shift')) {
                    // Force Attack in place
                    moveTargetRef.current = null;
                    // NEW: Use separate Weapon System
                    performWeaponAttack(state, mouseWorld, callbacks);
                } else {
                    // Move
                    // Fix: If we are holding Right Click (Casting), Left Click Move should still work?
                    // "Right click should only cast spells".

                    // Refined Logic: If clicking close to self? No, that's annoying.

                    // NEW: Try Pickup Loot first (High priority)
                    if (tryPickupLoot(state, mouseWorld, callbacks)) {
                        moveTargetRef.current = null;
                        // Chase target clearing handled by GameCanvas wrapper usually, or implicitly by stopping here.
                    } else {
                        moveTargetRef.current = mouseWorld;
                    }
                }
            }

            // 4. MOVEMENT EXECUTION
            if (moveTargetRef.current) {
                // Auto-Attack Locking Check
                if (state.player.lockedTargetId) {
                    const enemy = state.enemies.find(e => e.id === state.player.lockedTargetId);
                    if (enemy && !enemy.isDead) {
                        // Determine Range based on Weapon
                        // Ideally this comes from Weapon Def directly or hardcoded for now
                        const ATTACK_RANGE = 2.5;

                        if (getDistance(state.player.pos, enemy.pos) <= ATTACK_RANGE) {
                            moveTargetRef.current = null;
                            // NEW: Use separate Weapon System
                            performWeaponAttack(state, enemy.pos, callbacks);
                        } else {
                            // Keep approaching (update target pos in case enemy moved)
                            moveTargetRef.current = { ...enemy.pos };
                        }
                    } else {
                        state.player.lockedTargetId = null;
                    }
                }
            }

            if (moveTargetRef.current) {
                // Apply Movement
                const dist = getDistance(state.player.pos, moveTargetRef.current);
                if (dist < 0.1 && !inputSystem.leftMouseDown) {
                    moveTargetRef.current = null;
                } else if (dist >= 0.1) {
                    const dir = normalize({ x: moveTargetRef.current.x - state.player.pos.x, y: moveTargetRef.current.y - state.player.pos.y });

                    // Speed Calcs
                    const mountMult = state.player.isMounted ? MOUNT_SPEED_MULT : 1;
                    const potionMult = state.player.activeBuffs.speedBoost > 0 ? POTION_CONFIG.SPEED.multiplier : 1;
                    // Roll blocked earlier, so rollMult is 1.

                    let totalSwiftness = state.player.baseStats.swiftness;
                    Object.values(state.player.equipment).forEach((itemVal) => {
                        const item = itemVal as EquipmentItem | null;
                        if (item?.stats.swiftness) totalSwiftness += item.stats.swiftness;
                    });
                    const baseVitSpeed = CLASS_CONFIG[state.player.heroClass]?.stats.swiftness || 0;
                    const swiftnessToSpeedMult = 1 + ((totalSwiftness + baseVitSpeed) * BASE_STAT_CONFIG.SWIFTNESS.speedPerPoint);

                    // Apply Mobile Cast Penalty
                    // Check if action effectively allows movement (swings, mobile casts)
                    // Re-derive for clarity or use shared flag if scope permitted
                    const isMobileCast = state.player.casting.isCasting &&
                        (state.player.casting.currentSpell === SpellType.SWORD_SWIPE || state.player.casting.currentSpell === SpellType.WHIRLWIND_STRIKE);
                    const isAttacking = state.player.attack.isAttacking;

                    let actionPenalty = 1.0;
                    if (isMobileCast || isAttacking) {
                        actionPenalty = 0.5; // 50% Slow while swinging
                    }

                    // Transform Modifiers
                    let morphMult = 1.0;
                    if (state.player.morph === 'WOLF') morphMult = 1.5;
                    if (state.player.morph === 'BEAR') morphMult = 0.6;
                    if (state.player.morph === 'SHADOW') morphMult = 1.2;

                    const basePixelSpeed = state.player.speed * 2.5 * mountMult * potionMult * swiftnessToSpeedMult * actionPenalty * morphMult;
                    const worldSpeed = toWorld(basePixelSpeed, 0).x * 2;

                    const nextX = state.player.pos.x + dir.x * worldSpeed;
                    const nextY = state.player.pos.y + dir.y * worldSpeed;

                    if (isPositionValid(state, nextX, state.player.pos.y, state.player.radius)) state.player.pos.x = nextX;
                    if (isPositionValid(state, state.player.pos.x, nextY, state.player.radius)) state.player.pos.y = nextY;
                }
            }

            updatePhysics(state, { leftMouseDown: inputSystem.leftMouseDown }, moveTargetRef, callbacks);
            cleanDeadEntities(state);
        }
    }

    // --- TIMING LOG ---
    const end = performance.now();
    totalUpdateTime += (end - start);
    frameCount++;

    if (end - lastLogTime > 2000) {
        const avg = totalUpdateTime / frameCount;
        console.log(`UpdateGame Average: ${avg.toFixed(2)}ms (Frames: ${frameCount})`);
        totalUpdateTime = 0;
        frameCount = 0;
        lastLogTime = end;
    }
};
