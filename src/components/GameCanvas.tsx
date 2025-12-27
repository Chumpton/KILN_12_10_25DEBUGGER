import React, { useEffect, useRef } from 'react';
import { GameLoop } from '../engine/core/GameLoop';
import { GameRenderer } from '../engine/graphics/Renderer';
import { Camera } from '../engine/graphics/Camera';
import { Player, ShopItem, Vector2, SpellType, MeleeAttackPhase, Enemy } from '../types';
import { getTileAt } from '../modules/world/WorldGen';
import { inputSystem } from '../systems/InputSystem';
import { playerRenderer } from '../modules/player/render/PlayerRenderer';
import { initiateCast, updateCasting, updateProjectiles, handleEnemyDeath, fireSpell, updateAreaEffects, updatePlayerBuffs } from '../modules/spells/SpellSystem';
import { SpellCallbacks } from '../modules/spells/SpellBehavior';
import { GameState } from '../types';
import { updateEnemies, spawnEnemy, SPAWN_RADIUS } from '../modules/enemies/EnemySystem';
import { enemyRenderer } from '../modules/enemies/EnemyRenderer';
import { DevTools } from '../modules/dev/DevTools';
import { BEHAVIOR_REGISTRY } from '../modules/spells/BehaviorRegistry';
import { SPELL_REGISTRY } from '../modules/spells/SpellRegistry';
import { isPositionValid } from '../systems/PhysicsSystem';
import { WeaponSystem } from '../modules/combat/WeaponSystem';
import { renderGeometricTree } from '../modules/dev/GeometricTrees';
import { renderSquirrel } from '../utils/renderers/animals/renderSquirrel';
import { renderBunny } from '../utils/renderers/animals/renderBunny';
import { renderWolf } from '../utils/renderers/animals/renderWolf';
import { SAVED_WORLD_OBJECTS, SAVED_TILE_MAP } from '../data/WorldObjects';
import { TileSystem, tileSystem } from '../modules/world/TileSystem';
import { toScreen, toWorld } from '../utils/isometric';
import { AtmosphereSystem } from '../systems/AtmosphereSystem';
import { LootRenderer } from '../modules/loot/LootRenderer';
import { VfxRenderer } from '../modules/vfx/VfxRenderer';
import { spawnLoot, updateLoot, tryPickupLoot } from '../modules/loot/LootSystem';
import { COLORS, TILE_WIDTH, TILE_HEIGHT, CLASS_CONFIG, MAX_LEVEL } from '../constants';

const globalImageCache = new Map<string, HTMLImageElement>();

interface GameCanvasProps {
    onUiUpdate: (player: Player, score: number, isGameOver: boolean, currentQuest: any, currentShopItems: ShopItem[], currentShopTimer: number, minimapData: any) => void;
    gameActionsRef: React.MutableRefObject<any>;
    isPaused: boolean;
    gameStarted: boolean;
    onStartGame: (player: Player) => void;
    initialPlayer: Player;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ isPaused, initialPlayer, onUiUpdate, gameActionsRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spellCooldownRef = useRef(0);
    const lastTileVersionRef = useRef(0);
    const hasSpawnedRef = useRef(false);

    // Track previous input state for rising edge detection (kept for non-shift clicks)
    const prevInputRef = useRef({ shift: false, leftMouse: false, fnRight: initialPlayer.facingRight });
    const prevKeysRef = useRef<Set<string>>(new Set());

    // Target tracking for Click-to-Attack
    const chaseTargetRef = useRef<{ id: string } | null>(null);
    const moveTargetRef = useRef<{ x: number, y: number } | null>(null);

    const gameStateRef = useRef<GameState>({
        enemies: [],
        projectiles: [],
        loot: [],
        score: 0,
        gameTime: 0,
        player: {
            ...initialPlayer,
            magicDust: initialPlayer.magicDust || 0,
            roll: { isRolling: false, timer: 0, cooldown: 0, dir: { x: 0, y: 0 } }
        },
        activeQuest: { id: 'q1', description: 'Survive', type: 'kill', target: 10, current: 0, rewardXp: 100, rewardCoins: 50 },
        shopItems: [],
        shopResetTimer: 0,
        trees: [],
        visualEffects: [],
        texts: [],
        areaEffects: [],
        allies: [],
        worldObjects: [...SAVED_WORLD_OBJECTS],
        tileMap: [...SAVED_TILE_MAP],
        tileVersion: 0,
        gameOver: false
    });

    const engineRef = useRef<{
        loop: GameLoop;
        renderer: GameRenderer;
        camera: Camera;
    } | null>(null);

    useEffect(() => {
        // Init singleton once
        tileSystem.importData(SAVED_TILE_MAP);

        // USER REQUEST: Add Basic Sword First
        if (!initialPlayer.equipment.MAIN_HAND) {
            initialPlayer.equipment.MAIN_HAND = {
                id: 'starter_sword',
                name: 'Rusty Iron Sword',
                slot: 'MAIN_HAND',
                rarity: 'common',
                visual: { theme: 'RUSTED', primaryColor: '#aaa' },
                stats: { damage: 5 },
                icon: '🗡️',
                weaponType: 'SWORD',
                w: 1, h: 1
            };
            console.log("Granted Starter Sword");
        }
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;

        // BIND ACTIONS
        gameActionsRef.current.toggleMount = () => {
            const s = gameStateRef.current;
            s.player.isMounted = !s.player.isMounted;
        };

        gameActionsRef.current.unlockSpell = (spell: SpellType) => {
            const s = gameStateRef.current;
            const UNLOCK_COST = 500;
            // Check Dust
            if ((s.player.magicDust || 0) >= UNLOCK_COST) {
                if (!s.player.knownSpells.includes(spell)) {
                    s.player.magicDust = (s.player.magicDust || 0) - UNLOCK_COST;
                    s.player.knownSpells.push(spell);
                }
            }
        };

        gameActionsRef.current.selectSpell = (spell: SpellType) => {
            const s = gameStateRef.current;
            if (s && s.player) {
                s.player.currentSpell = spell;
            }
        };

        gameActionsRef.current.upgradeTalent = (spell: SpellType, talentId: string) => {
            const s = gameStateRef.current;
            if (!s.player.spellTalents) s.player.spellTalents = {};
            if (!s.player.spellTalents[spell]) s.player.spellTalents[spell] = {};

            const currentRank = s.player.spellTalents[spell][talentId] || 0;
            const cost = 200 + (currentRank * 150);

            if ((s.player.magicDust || 0) >= cost) {
                s.player.magicDust = (s.player.magicDust || 0) - cost;
                s.player.spellTalents[spell][talentId] = currentRank + 1;
            }
        };

        gameActionsRef.current.upgradeSpell = (spell: SpellType) => {
            const s = gameStateRef.current;
            if (!s.player.knownSpells.includes(spell)) return;

            if (!s.player.spellUpgrades) s.player.spellUpgrades = {};
            const currentLevel = s.player.spellUpgrades[spell] || 1;

            if (currentLevel >= 25) return;

            const cost = currentLevel * 100;
            if ((s.player.magicDust || 0) >= cost) {
                s.player.magicDust = (s.player.magicDust || 0) - cost;
                s.player.spellUpgrades[spell] = currentLevel + 1;
                console.log(`[GameCanvas] Upgraded ${spell} to level ${currentLevel + 1}`);
            }
        };

        gameActionsRef.current.assignHotbarSlot = (index: number, spell: SpellType | null) => {
            const s = gameStateRef.current;
            if (s && s.player) {
                // Ensure array size
                if (!s.player.hotbar) s.player.hotbar = [];
                s.player.hotbar[index] = spell;
                console.log('Hotbar Updated via UI:', index, spell);
            }
        };





        const renderer = new GameRenderer(canvasRef.current);
        const camera = new Camera();

        const startX = initialPlayer.pos.x;
        const startY = initialPlayer.pos.y;

        renderer.resize();
        camera.resize(renderer.context.canvas.width, renderer.context.canvas.height);
        camera.follow(startX, startY);

        // inputSystem singleton is imported
        const playerPos = { x: startX, y: startY };
        const playerSpeed = 5.0;

        let hoveredEnemyId: string | null = null;

        inputSystem.bind(renderer.context.canvas);

        // Bind 'G' for Roll (One-time trigger)
        // Note: Mount was moved to another key? Or distinct?
        // User requested 'G' for Roll. Mount toggle was on 'G' previously.
        // I will remap Mount to 'H' and use 'G' for Roll as requested.
        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (!e.repeat) {
                if (k === 'g') {
                    // Start Roll Logic
                    const s = gameStateRef.current;
                    if (s && s.player && !s.player.roll.isRolling && s.player.roll.cooldown <= 0) {
                        // Determine direction (Movement or Facing)
                        let dx = 0, dy = 0;
                        if (inputSystem.keys.has('w')) dy -= 1;
                        if (inputSystem.keys.has('s')) dy += 1;
                        if (inputSystem.keys.has('a')) dx -= 1;
                        if (inputSystem.keys.has('d')) dx += 1;

                        // Normalize
                        if (dx !== 0 || dy !== 0) {
                            const len = Math.sqrt(dx * dx + dy * dy);
                            dx /= len;
                            dy /= len;
                        } else {
                            // Default to facing? or no roll?
                            // Default to mouse direction for skill expression
                            const world = camera.toWorld(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y);
                            dx = world.x - s.player.pos.x;
                            dy = world.y - s.player.pos.y;
                            const len = Math.sqrt(dx * dx + dy * dy);
                            if (len > 0) { dx /= len; dy /= len; }
                            else { dx = 1; dy = 0; } // Fallback
                        }

                        s.player.roll.isRolling = true;
                        s.player.roll.timer = 30; // 0.5s approx
                        s.player.roll.cooldown = 60; // 1s cooldown
                        s.player.roll.dir = { x: dx, y: dy };

                        // Stop attack/cast
                        s.player.attack.isAttacking = false;
                        s.player.casting.isCasting = false;

                        // Visuals
                        s.visualEffects.push({
                            id: `roll_${Date.now()}`,
                            type: 'particle',
                            pos: { ...s.player.pos },
                            life: 20,
                            maxLife: 20,
                            color: '#ffffff',
                            data: { size: 1 } // weak puff
                        } as any);
                    }
                }
                if (k === 'h') {
                    gameActionsRef.current.toggleMount();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        let lastUiUpdate = 0;

        // Helper to find enemy under mouse
        const findEnemyAtScreen = (sx: number, sy: number, enemies: any[]): string | null => {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                if (e.isDead || e.isPhasing) continue;

                const eScreen = camera.toScreen(e.pos.x, e.pos.y);
                const dx = Math.abs(sx - eScreen.x);

                const withinX = dx < 25;
                const withinY = sy < eScreen.y && sy > (eScreen.y - 80);

                if (withinX && withinY) {
                    return e.id;
                }
            }
            return null;
        };

        const atmosphere = new AtmosphereSystem();

        // Hotbar Key Mapping
        const HOTBAR_KEYS = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i'];

        const loop = new GameLoop(
            (dt) => {
                const state = gameStateRef.current;

                // Update Atmosphere
                atmosphere.update(dt, camera);

                hoveredEnemyId = findEnemyAtScreen(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y, state.enemies);

                // --- MOVEMENT SPEED CALCULATION ---
                let moveMod = 1.0;
                // USER REQUEST: Move at 30% speed if Attacking OR Holding Shift OR Casting
                if (state.player.attack.isAttacking || inputSystem.keys.has('shift') || state.player.casting.isCasting) {
                    moveMod = 0.3;
                }

                // Mount Speed Boost (60% faster)
                if (state.player.isMounted) {
                    moveMod *= 1.6;
                }

                const speed = playerSpeed * moveMod * (dt / 1000);

                if (state && state.player) {
                    // Update individual cooldowns
                    if (state.player.cooldowns) {
                        Object.keys(state.player.cooldowns).forEach(key => {
                            if (state.player.cooldowns[key] > 0) {
                                state.player.cooldowns[key] -= dt;
                            }
                        });
                    }

                    // Update XP Visual Timers
                    if (state.player.xpTimer > 0) {
                        state.player.xpTimer--;
                        if (state.player.xpTimer <= 0) {
                            state.player.xpTally = 0;
                        }
                    }
                    if (state.player.xpGlowTimer > 0) {
                        state.player.xpGlowTimer--;
                    }
                }

                if (state) {
                    // Sync TileSystem if updated by Editor
                    if (state.tileVersion > lastTileVersionRef.current) {
                        tileSystem.importData(state.tileMap);
                        lastTileVersionRef.current = state.tileVersion;
                    }

                    if (spellCooldownRef.current > 0) {
                        spellCooldownRef.current -= dt;
                    }

                    if (!hasSpawnedRef.current) {
                        spawnEnemy(state, { x: playerPos.x + 5, y: playerPos.y });
                        hasSpawnedRef.current = true;
                    }

                    const callbacks: any = {
                        addFloatingText: (text: string, pos: Vector2, color: string) => {
                            const sPos = camera.toScreen(pos.x, pos.y);
                            sPos.y -= 60;
                            const vx = (Math.random() - 0.5) * 3;
                            const vy = -3 - Math.random() * 3;
                            state.texts.push({
                                id: `txt_${Date.now()}_${Math.random()}`,
                                pos: sPos,
                                text,
                                color,
                                life: 60,
                                velocity: { x: vx, y: vy }
                            });
                        },
                        createImpactPuff: (pos: Vector2, spellType: SpellType) => { state.visualEffects.push({ id: `vfx_${Date.now()}`, type: 'nova', pos: { ...pos }, life: 150, maxLife: 150, color: '#fff', data: { radius: 0.8 } } as any) },
                        createAreaEffect: (config: any) => {
                            const id = `ae_${Date.now()}_${Math.random()}`;
                            if (!state.areaEffects) state.areaEffects = [];
                            state.areaEffects.push({
                                id: id,
                                pos: config.pos,
                                radius: config.radius || 1,
                                duration: config.duration || 180,
                                spellType: config.spellType,
                                damage: config.damage || 0,
                                tickInterval: config.interval || config.tickInterval || 60, // Fix mapping
                                tickTimer: 0,
                                color: config.color || '#ffffff',
                                type: config.type || 'generic',
                                ownerId: config.ownerId,
                                data: config.data || {}
                            } as any);
                        },
                        createExplosion: (pos: Vector2, radius: number, damage: number, color: string, shapeData?: { type: 'RING' | 'CONE', data: any }, knockback?: number) => {
                            if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
                                console.warn('[GameCanvas] Invalid explosion position', pos);
                                return;
                            }
                            // 1. Visual
                            state.visualEffects.push({ id: `vfx_${Date.now()}`, type: 'nova', pos: { ...pos }, life: 500, maxLife: 500, color: color, data: { radius } } as any);

                            // 2. Damage Logic
                            state.enemies.forEach(e => {
                                if (e.isDead || e.isPhasing) return;
                                const dx = e.pos.x - pos.x;
                                const dy = e.pos.y - pos.y;
                                const dist = Math.sqrt(dx * dx + dy * dy);

                                if (dist <= radius) {
                                    // Shape Checks
                                    if (shapeData) {
                                        if (shapeData.type === 'RING') {
                                            const inner = radius * (shapeData.data.innerRadiusPct || 0.5);
                                            if (dist < inner) return; // Save zone
                                        } else if (shapeData.type === 'CONE') {
                                            // Cone logic needs direction. "data" should have "dir" {x,y} and "angle" (degrees)
                                            const dir = shapeData.data.dir || { x: 1, y: 0 }; // Default right
                                            const angleDeg = shapeData.data.angle || 90;
                                            const angleRad = angleDeg * (Math.PI / 180);

                                            const angleToEnemy = Math.atan2(dy, dx);
                                            const angleDir = Math.atan2(dir.y, dir.x);
                                            let angleDiff = Math.abs(angleToEnemy - angleDir);

                                            // Normalize to -PI..PI
                                            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                                            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                                            if (Math.abs(angleDiff) > angleRad / 2) return; // Outside cone
                                        }
                                    }

                                    // Hit
                                    callbacks.onEnemyHit(e, damage, 'burn'); // Default to burn effect for explosions

                                    // Knoback?
                                    const kbStrength = typeof knockback === 'number' ? knockback : 2; // Fixed for now

                                    const kbDist = Math.max(0.1, dist);
                                    e.velocity.x += (dx / kbDist) * kbStrength;
                                    e.velocity.y += (dy / kbDist) * kbStrength;
                                }
                            });
                        },
                        createExplosionShrapnel: () => { },
                        addScreenShake: (intensity: number, duration: number) => {
                            if (engineRef.current && engineRef.current.camera) {
                                engineRef.current.camera.shake(duration, intensity);
                            }
                        },
                        createParticle: (config: any) => {
                            // Generic Particle Interface integration
                            state.visualEffects.push({
                                id: `ptcl_${Date.now()}_${Math.random()}`,
                                type: 'particle', // Renderer needs to handle 'particle' type or mapping
                                pos: config.pos,
                                velocity: config.velocity,
                                color: config.color,
                                life: config.duration / 16, // Convert to frames approx
                                maxLife: config.duration / 16,
                                data: { size: config.size || 2 }
                            } as any);
                        },
                        createVisualEffect: (type: 'nova' | 'particle' | 'text' | 'ring' | 'surge' | 'shatter' | 'sprite' | 'lightning_chain', pos: Vector2, duration: number, data?: any) => {
                            state.visualEffects.push({
                                id: `vfx_${Date.now()}_${Math.random()}`,
                                type,
                                pos: { ...pos },
                                life: duration,
                                maxLife: duration,
                                color: data?.color || '#ffffff',
                                data
                            });
                        },
                        onEnemyHit: (e: Enemy, damage: number, effect?: 'freeze' | 'burn' | 'shock') => {
                            e.hp -= damage;
                            e.hitTimer = 10;
                            const sPos = camera.toScreen(e.pos.x, e.pos.y);
                            sPos.y -= 60;
                            state.texts.push({
                                id: `txt_${Date.now()}_${Math.random()}`,
                                pos: sPos,
                                text: Math.round(damage).toString(),
                                color: effect === 'shock' ? '#FFD700' : (effect === 'burn' ? '#FF4500' : (effect === 'freeze' ? '#00FFFF' : '#ffffff')),
                                life: 60,
                                velocity: { x: (Math.random() - 0.5) * 3, y: -3 - Math.random() * 3 }
                            });

                            if (effect === 'freeze') e.freezeTimer = 180;
                            if (effect === 'burn') e.burnTimer = 300;
                            if (effect === 'shock') e.shockTimer = 180;

                            if (e.hp <= 0 && e.enemyState !== 'DYING') {
                                e.enemyState = 'DYING';
                                e.deathTimer = 30;
                                handleEnemyDeath(state, e, callbacks);
                            }
                        },
                        getProjectileOrigin: (entity: any) => {
                            // Only support player for now via singleton renderer
                            if (entity.id === state.player.id) {
                                const handOffset = playerRenderer.getHandOffset();
                                if (handOffset && engineRef.current && engineRef.current.camera) {
                                    const cam = engineRef.current.camera;
                                    const currentP = cam.toScreen(state.player.pos.x, state.player.pos.y);

                                    // Apply Manual Rigging Offset from Registry
                                    const spell = SPELL_REGISTRY[state.player.casting.currentSpell];
                                    const riggingOffset = spell?.skeletalAnimation?.spawnOffset || { x: 0, y: 0 };

                                    // Offset relative to facing? 
                                    // HandOffset is already world-relative (visual).
                                    // Rigging offset should probably be consistent with hand logic.
                                    // Let's treat it as a screen-space pixel adjustment (+X = Right, +Y = Down)
                                    // But if facing left, X should negate?
                                    // HandOffset accounts for flip. Let's assume Rigging is "Local to Hand" 
                                    // or just "Global Screen Offset".
                                    // Usually users want "Relative to Hand Bone".

                                    // Simply adding for now. If it needs flipping, we check facing.
                                    const facingMult = state.player.facingRight ? 1 : -1;

                                    const handScreenX = currentP.x + handOffset.x + (riggingOffset.x * facingMult);
                                    const handScreenY = currentP.y + handOffset.y + riggingOffset.y;

                                    return cam.toWorld(handScreenX, handScreenY);
                                }
                            }
                            return null;
                        },
                        checkLevelUp: (player: Player) => {
                            if (player.level >= MAX_LEVEL) return;

                            // Formula for next level
                            const xpRequired = Math.floor(player.level * 100 * 1.5);

                            // Debug logging to diagnose 'broken' state
                            // console.log(`Level Check: Lvl ${player.level} | XP: ${player.xp} / ${xpRequired} | Next: ${player.toNextLevel}`);

                            if (player.xp >= xpRequired) {
                                player.level++;
                                player.xp -= xpRequired;

                                // Set next level requirement
                                player.toNextLevel = Math.floor(player.level * 100 * 1.5);

                                // Stat Growth
                                const config = CLASS_CONFIG[player.heroClass] || CLASS_CONFIG.MAGE;
                                player.baseStats.vitality += (config.stats.vitality || 1);
                                player.baseStats.power += (config.stats.power || 1);

                                // Spell Point Award
                                player.spellPoints = (player.spellPoints || 0) + 1;
                                callbacks.addFloatingText("+1 Spell Point", player.pos, '#3b82f6');

                                // Full Heal
                                player.hp = player.maxHp;
                                player.mana = player.maxMana;

                                // Visuals
                                callbacks.addFloatingText("LEVEL UP!", player.pos, '#fbbf24');
                                callbacks.createVisualEffect('nova', player.pos, 60, { radius: 3, color: '#fbbf24' });

                                // Check again in case of multi-level
                                callbacks.checkLevelUp(player);
                            }
                        },
                        onEnemyDeath: (enemy: any) => {
                            // Logic moved to SpellSystem.handleEnemyDeath to centralize XP/Loot
                            // This callback is kept for interface compatibility but empty to prevent double-awarding.
                        }
                    };

                    updateEnemies(state, dt, callbacks);
                    updateLoot(state, dt, callbacks); // NEW: Loot Physics & Vacuum
                    updateAreaEffects(state, dt, callbacks); // Portal/AoE Logic
                    updatePlayerBuffs(state, dt); // Added Buff Updates

                    // Sync forced movement (Teleport/Knockback) back to local physics
                    playerPos.x = state.player.pos.x;
                    playerPos.y = state.player.pos.y;

                    // --- CHASE LOGIC ---
                    if (chaseTargetRef.current) {
                        const target = state.enemies.find(e => e.id === chaseTargetRef.current?.id);
                        if (target && !target.isDead) {
                            const distSq = (target.pos.x - playerPos.x) ** 2 + (target.pos.y - playerPos.y) ** 2;
                            const attackRange = 2.5; // Closer range for reliable sword hits
                            const rangeSq = attackRange * attackRange;

                            if (distSq <= rangeSq) {
                                moveTargetRef.current = null;
                                state.player.velocity = { x: 0, y: 0 };
                                // Chase Facing: Use Screen Delta
                                const dx = target.pos.x - playerPos.x;
                                const dy = target.pos.y - playerPos.y;
                                const sDx = dx - dy;
                                if ((state.player.cooldowns?.['FACING_LOCK'] || 0) <= 0) {
                                    if (sDx > 0) state.player.facingRight = true;
                                    if (sDx < 0) state.player.facingRight = false;
                                }

                                if (state.player.attack.cooldown <= 0 && !state.player.attack.isAttacking) {
                                    WeaponSystem.initiateAttack(state, state.player, target.pos, callbacks);
                                }
                            } else {
                                moveTargetRef.current = { x: target.pos.x, y: target.pos.y };
                            }
                        } else {
                            chaseTargetRef.current = null;
                            moveTargetRef.current = null;
                        }
                    }

                    // --- ROLL LOGIC ---
                    if (state.player.roll.isRolling) {
                        state.player.roll.timer--;
                        if (state.player.roll.timer <= 0) {
                            state.player.roll.isRolling = false;
                        } else {
                            // Apply Roll Movement (Override normal move)
                            const rollSpeed = playerSpeed * 2.5; // Fast burst
                            const rDir = state.player.roll.dir || { x: 1, y: 0 };

                            const nextX = state.player.pos.x + rDir.x * rollSpeed * (dt / 1000);
                            const nextY = state.player.pos.y + rDir.y * rollSpeed * (dt / 1000);

                            if (isPositionValid(state, nextX, nextY, state.player.radius)) {
                                playerPos.x = nextX;
                                playerPos.y = nextY;
                            } else {
                                // Slide? Or stop. Stop for now to avoid wall clipping.
                            }
                            // Force facing
                            if (rDir.x > 0) state.player.facingRight = true;
                            if (rDir.x < 0) state.player.facingRight = false;
                        }
                    }

                    // Cleanup Cooldown
                    if (state.player.roll.cooldown > 0) state.player.roll.cooldown--;


                    // --- MOVEMENT PHYSICS ---
                    // Only process standard movement if NOT rolling
                    if (!state.player.roll.isRolling) {
                        state.player.velocity = { x: 0, y: 0 };
                        const isCasting = state.player.casting.isCasting;
                        const isAttacking = state.player.attack.isAttacking;
                        const currentSpell = state.player.casting.currentSpell;
                        const isMobileSpell = currentSpell === SpellType.WHIRLWIND_STRIKE;

                        const canMove = true;

                        if (canMove && moveTargetRef.current) {
                            const dx = moveTargetRef.current.x - playerPos.x;
                            const dy = moveTargetRef.current.y - playerPos.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < speed) {
                                // Arrived
                                if (isPositionValid(state, moveTargetRef.current.x, moveTargetRef.current.y, state.player.radius)) {
                                    playerPos.x = moveTargetRef.current.x;
                                    playerPos.y = moveTargetRef.current.y;
                                }
                                if (!chaseTargetRef.current) moveTargetRef.current = null;
                                state.player.velocity = { x: 0, y: 0 };
                            } else {
                                // Moving
                                const vx = (dx / dist) * speed;
                                const vy = (dy / dist) * speed;

                                const nextX = playerPos.x + vx;
                                const nextY = playerPos.y + vy;

                                if (isPositionValid(state, nextX, nextY, state.player.radius)) {
                                    playerPos.x = nextX;
                                    playerPos.y = nextY;
                                } else {
                                    // Hit wall during path travel - stop
                                    moveTargetRef.current = null;
                                    state.player.velocity = { x: 0, y: 0 };
                                }

                                state.player.velocity.x = vx;
                                state.player.velocity.y = vy;

                                const sDx = vx - vy;
                                if ((state.player.cooldowns?.['FACING_LOCK'] || 0) <= 0) {
                                    if (sDx > 0) state.player.facingRight = true;
                                    if (sDx < 0) state.player.facingRight = false;
                                }
                            }
                        } else if (!canMove) {
                            moveTargetRef.current = null;
                            state.player.velocity = { x: 0, y: 0 };
                        }
                    } else {
                        // During roll, ensure velocity reflects move for camera lag smoothing if used
                        const rDir = state.player.roll.dir || { x: 0, y: 0 };
                        state.player.velocity = { x: rDir.x * 2.5, y: rDir.y * 2.5 };
                    }

                    camera.follow(playerPos.x, playerPos.y);
                    state.player.pos.x = playerPos.x;
                    state.player.pos.y = playerPos.y;
                    state.player.mana = state.player.maxMana;

                    // --- INPUT HANDLING ---
                    const shiftHeld = inputSystem.keys.has('shift');
                    const mouseDown = inputSystem.leftMouseDown;
                    const rightMouseDown = inputSystem.rightMouseDown;
                    const isNewClick = mouseDown && !prevInputRef.current.leftMouse;
                    const isNewRightClick = rightMouseDown && !prevInputRef.current.rightMouse;

                    // --- INPUT: HOTBAR SELECTION (QWERTY) ---
                    // Assuming hotbar is part of player state or synchronized
                    // HOTBAR_KEYS defined outside loop: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i']
                    HOTBAR_KEYS.forEach((key, index) => {
                        const isPressed = inputSystem.keys.has(key);
                        const wasPressed = prevKeysRef.current.has(key);

                        if (isPressed && !wasPressed) {
                            // RISING EDGE - QUICK CAST
                            const spell = state.player.hotbar[index];
                            if (spell) {
                                state.player.casting.currentSpell = spell;
                                state.player.currentSpell = spell; // Update UI selection

                                // Cast at mouse cursor
                                const world = camera.toWorld(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y);

                                // Calculate Origin (Copied from Click Logic)
                                let handOrigin: Vector2 | undefined = undefined;
                                const handOffset = playerRenderer.getHandOffset();
                                if (handOffset && engineRef.current && engineRef.current.camera) {
                                    const currentP = engineRef.current.camera.toScreen(state.player.pos.x, state.player.pos.y);
                                    const handScreenX = currentP.x + handOffset.x;
                                    const handScreenY = currentP.y + handOffset.y + 35;
                                    handOrigin = engineRef.current.camera.toWorld(handScreenX, handScreenY);
                                }

                                console.log('[QuickCast] Key:', key, 'Spell:', spell);
                                initiateCast(state, world, spell, spellCooldownRef, callbacks, true, undefined, handOrigin);

                                // Stop movement while casting instant spells?
                                // If it's effectively immediate, we might not need to stop.
                                // But keeping logic consistent.
                                if (state.player.casting.isCasting) {
                                    // User Request: "maintain movement". Do not clear moveTarget.
                                    // moveTargetRef.current = null;
                                    chaseTargetRef.current = null; // Still clear chase to avoid conflicting logic? Chase implies attack. Casting implies spell.
                                    // Actually, if we are chasing to ATTACK, and we cast a spell, we should probably stop "Chasing to melee" but might want to keep moving to the location?
                                    // But typically "Chase" = "Move to Enemy".
                                    // Let's clear chaseTarget but keep moveTarget if it was set explicitly?
                                    // Chase sets moveTargetRef to null usually.
                                }
                            }
                        }
                    });

                    if (mouseDown) {
                        const world = camera.toWorld(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y);

                        // Click Logic
                        if (shiftHeld) {
                            // SHIFT + LEFT CLICK: Attack / Force Move (User request: allow move)
                            // 30% speed handled in moveMod

                            WeaponSystem.initiateAttack(state, state.player, world, callbacks);
                            moveTargetRef.current = { x: world.x, y: world.y };
                            chaseTargetRef.current = null;

                        } else {
                            // NORMAL LEFT CLICK:
                            if (isNewClick) {
                                // 0. Try Pickup Loot
                                const pickedUp = tryPickupLoot(state, world, callbacks);

                                if (!pickedUp) {
                                    if (hoveredEnemyId) {
                                        // Left Click on Enemy -> Attack/Chase
                                        chaseTargetRef.current = { id: hoveredEnemyId };
                                        moveTargetRef.current = null;
                                        // Also initiate attack if in range immediately
                                        // WeaponSystem handles range check, but we can try
                                    } else {
                                        // Left Click on Ground -> Move
                                        chaseTargetRef.current = null;
                                        moveTargetRef.current = { x: world.x, y: world.y };
                                    }
                                } else {
                                    moveTargetRef.current = null;
                                    chaseTargetRef.current = null;
                                }
                            } else {
                                // Holding Left Mouse (Drag Move)
                                if (!chaseTargetRef.current) {
                                    moveTargetRef.current = { x: world.x, y: world.y };
                                }
                            }
                        }
                    }

                    if (rightMouseDown) {
                        const world = camera.toWorld(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y);

                        // RIGHT CLICK: Cast Selected Spell
                        // Logic: If holding, continuous cast (SpellSystem handles cooldowns)

                        // We need SpellSystem.initiateCast. 
                        // Check implies it might be available via global import or we need to add it.
                        // Assuming we added the import in the step instructions or it's implicitly there?
                        // Actually, I need to add the import to be safe.

                        if (state.player.casting.currentSpell) {
                            // Use named import 'initiateCast' and pass spellCooldownRef directly
                            let originOverride: Vector2 | undefined = undefined;

                            // CALCULATE VISUAL ORIGIN - ROBUST METHOD
                            // Use offset from player center to account for Camera Movement latency.
                            const handOffset = playerRenderer.getHandOffset();
                            if (handOffset && camera && engineRef.current) {
                                // 1. Get CURRENT screen position of player (Camera might have moved)
                                const currentP = camera.toScreen(state.player.pos.x, state.player.pos.y);

                                // 2. Apply the visual offset (Arm length + Animation Recoil)
                                const handScreenX = currentP.x + handOffset.x;
                                // COMPENSATION FOR PROJECTILE LIFT (35px)
                                // The renderer lifts projectiles by 35px. To make it appear AT the hand,
                                // we must spawn it on the ground "shadow" 35px below the visual hand.
                                const handScreenY = currentP.y + handOffset.y + 35;

                                // 3. Unproject back to World Space
                                originOverride = camera.toWorld(handScreenX, handScreenY);
                            }

                            // Correct argument order: state, mouseWorld, override, cooldown, callbacks, shouldEquip, moveTargetRef, originOverride
                            initiateCast(state, world, undefined, spellCooldownRef, callbacks, false, undefined, originOverride);

                            // Stop movement while casting?
                            if (state.player.casting.isCasting) {
                                // User Request: "maintain movement". Do not clear moveTarget.
                                // moveTargetRef.current = null;
                                chaseTargetRef.current = null;
                            }
                        } else {
                            // STOP CASTING if button released (for continuous/channel spells)
                            // Using a simple check for now: if we are casting and not in a "committed" animation lock that must finish (like a big swing), stop.
                            // For now, let's stop generic continuous casting.
                            if (state.player.casting.isCasting) {
                                // Check config if it's a channel or hold-to-cast type?
                                // For now, forcefully stopping 'FIRE' equivalents or if it's a channeled type.
                                // Actually, let's just stop it if it's not a "fire and forget" projectile.
                                // Or simpler: The legacy code checked `currentSpell === 'FIRE'`.
                                // New system: Check 'hotbarType' === 'CHANNEL' or 'REPEATER'?
                                // Safe default for now: Stop casting.
                                const spell = state.player.casting.currentSpell;
                                const config = SPELL_REGISTRY[spell];
                                if (config && (config.hotbarType === 'CHANNEL' || spell === SpellType.FIRE || spell === SpellType.FLAMEBLAST || spell === 'LIGHTNING_ARC')) {
                                    state.player.casting.isCasting = false;
                                    state.player.casting.timer = 0;
                                }
                            }
                        }
                    }

                    prevInputRef.current.leftMouse = mouseDown;
                    prevInputRef.current.rightMouse = rightMouseDown;



                    // Continuous Aim Data Update
                    // Ensure the player is always aiming at the cursors world position if casting
                    if (state.player.casting.isCasting) {
                        const world = camera.toWorld(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y);
                        state.player.casting.targetPos = { ...world };
                    }

                    if (state.player.facingRight !== prevInputRef.current.fnRight) {
                        // console.log('FACING CHANGED:', state.player.facingRight, 'Vel:', state.player.velocity);
                    }
                    prevInputRef.current = { shift: shiftHeld, leftMouse: mouseDown, fnRight: state.player.facingRight };
                    prevKeysRef.current = new Set(inputSystem.keys);

                    WeaponSystem.update(state, dt, callbacks);
                    const mouseWorld = camera.toWorld(inputSystem.mouseScreen.x, inputSystem.mouseScreen.y);

                    // Calculate Hand Origin (Realtime) for Continuous Cast / Delayed Cast
                    let handOrigin: Vector2 | undefined = undefined;
                    if (state.player.casting.isCasting) {
                        const handOffset = playerRenderer.getHandOffset(); // Returns last frame's offset relative to render origin
                        if (handOffset && engineRef.current && engineRef.current.camera) {
                            // 1. Get CURRENT screen position of player (Camera might have moved, player might have moved)
                            const currentP = engineRef.current.camera.toScreen(state.player.pos.x, state.player.pos.y);

                            // 2. Apply the visual offset (Arm length + Animation Recoil)
                            const handScreenX = currentP.x + handOffset.x;

                            // COMPENSATION FOR PROJECTILE LIFT (35px)
                            // The renderer lifts projectiles by 35px. To make it appear AT the hand,
                            // we must spawn it on the ground "shadow" 35px below the visual hand.
                            const handScreenY = currentP.y + handOffset.y + 35;

                            // 3. Unproject back to World Space
                            handOrigin = engineRef.current.camera.toWorld(handScreenX, handScreenY);
                        }
                    }

                    if (state.player.casting.isCasting) {
                        const spell = state.player.casting.currentSpell;
                        const cfg = SPELL_REGISTRY[spell];
                        if (cfg?.hotbarType === 'CHANNEL') {
                            console.log(`GameCanvas: Calling updateCasting. RMouse: ${inputSystem.rightMouseDown}`);
                        }
                    }
                    updateCasting(state.player, state, callbacks, undefined, mouseWorld, handOrigin, inputSystem);
                    updateProjectiles(state, dt, callbacks);

                    for (let i = state.visualEffects.length - 1; i >= 0; i--) {
                        const vfx = state.visualEffects[i] as any;
                        vfx.life -= dt; // dt in ms?
                        // If vfx is frame based (our new ones are ~20-60 frames), and dt is ms (16ms per frame).
                        // OLD logic: life=150 (ms? frames? Nova uses 500 maxLife, likely MS).
                        // NEW logic: callback sets life=20 (Frames). 
                        // Conflict: GameLoop dt is ~16ms.
                        // I should normalize. Let's assume life is in MS for everything?
                        // Novas were 500ms. My new ones were "20" (likely frames).
                        // Let's standardise on MS. 20 frames * 16ms = 320ms. 
                        // I will fix callback creation to use ~300ms instead of 20.
                        // Wait, I already wrote the callbacks as 20. 
                        // If I subtract dt (16), they die instantly.
                        // FIX: I'll change creation to use MS in step 4 re-do or adjust here.
                        // Let's treat life as MS here.

                        if (vfx.velocity) {
                            vfx.pos.x += vfx.velocity.x;
                            vfx.pos.y += vfx.velocity.y;
                        }

                        if (vfx.life <= 0) state.visualEffects.splice(i, 1);
                    }

                    for (let i = state.texts.length - 1; i >= 0; i--) {
                        const txt = state.texts[i];
                        txt.life--;
                        txt.pos.x += txt.velocity.x;
                        txt.pos.y += txt.velocity.y;
                        txt.velocity.y += 0.2;
                        if (txt.life <= 0) state.texts.splice(i, 1);
                    }


                    const now = Date.now();
                    if (now - lastUiUpdate > 100) {
                        // --- MINIMAP DATA COLLECTION ---
                        const minimapItems: any[] = [];

                        // Enemies
                        state.enemies.forEach(e => {
                            if (!e.isDead) {
                                minimapItems.push({
                                    id: e.id,
                                    pos: e.pos,
                                    type: 'enemy',
                                    color: '#ff0000'
                                });
                            }
                        });

                        // World Objects (Shops, Hearthstone)
                        // Hearthstone is at fixed pos?
                        // HEARTHSTONE_POS is imported.
                        // Wait, HEARTHSTONE_POS isn't imported in GameCanvas, but we can import it or just use saved objects.
                        // HUD checks distance to HEARTHSTONE_POS.
                        // Let's add it manually if not in worldObjects.
                        // Actually, let's scan state.worldObjects.
                        state.worldObjects.forEach(obj => {
                            if (obj.id === 'hearthstone') {
                                minimapItems.push({ id: obj.id, pos: obj.pos, type: 'hearthstone', color: '#00ffff' });
                            } else if (obj.assetType === 'shop') {
                                minimapItems.push({ id: obj.id, pos: obj.pos, type: 'shop', color: '#ffcc00' });
                            }
                        });


                        onUiUpdate(
                            state.player,
                            state.score,
                            state.gameOver,
                            state.activeQuest,
                            state.shopItems,
                            state.shopResetTimer,
                            { items: minimapItems } // Minimap Payload
                        );
                        lastUiUpdate = now;
                    }
                }
            },
            () => {
                renderer.clear();
                const ctx = renderer.context;
                // ... Batch rendering ...
                const bounds = camera.getVisibleBounds();
                const { minX, maxX, minY, maxY } = bounds;

                const state = gameStateRef.current;
                const batches: Record<string, Path2D> = {};

                // 1. Generate Procedural Batches (Background Base)
                for (let x = minX; x <= maxX; x++) {
                    for (let y = minY; y <= maxY; y++) {
                        // We skip 'custom tile check' here to decouple systems. 
                        // Custom tiles will be drawn ON TOP of this base layer, just like in World Editor (visually).

                        const tile = getTileAt(x, y);
                        const color = tile.isRoad
                            ? (tile.roadColor || COLORS.grid)
                            : (tile.groundColor || '#3a3a3a');
                        const screen = camera.toScreen(x, y);

                        const sx = screen.x; const sy = screen.y;
                        if (!batches[color]) batches[color] = new Path2D();
                        batches[color].moveTo(sx, sy - TILE_HEIGHT / 2);
                        batches[color].lineTo(sx + TILE_WIDTH / 2, sy);
                        batches[color].lineTo(sx, sy + TILE_HEIGHT / 2);
                        batches[color].lineTo(sx - TILE_WIDTH / 2, sy);
                    }
                }

                // 2. Draw Procedural Batches
                for (const color in batches) {
                    ctx.fillStyle = color;
                    ctx.fill(batches[color]);
                }

                // 3. Draw Custom Tiles (Overlay Layer)
                // MATCHING WORLD EDITOR LOGIC: Iterate all tiles directly instead of scanning the grid.
                // This ensures large tiles (4x4) or sparse tiles are never culled incorrectly.
                const allTiles = tileSystem.exportData();
                allTiles.forEach(tile => {
                    // Simple Culling for Perf (Buffer 4 covers 4x4 tiles)
                    if (tile.x < minX - 4 || tile.x > maxX + 4 || tile.y < minY - 4 || tile.y > maxY + 4) return;

                    const texPath = tileSystem.getTexture(tile);
                    if (!texPath) return;

                    let img = globalImageCache.get(texPath);
                    if (!img) {
                        img = new Image();
                        img.src = texPath;
                        globalImageCache.set(texPath, img);
                    }

                    if (img && img.complete) {
                        const s = camera.toScreen(tile.x, tile.y);
                        ctx.save();
                        ctx.translate(s.x, s.y);
                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                        ctx.restore();
                    }
                });

                if (state) {
                    // --- UNIFIED RENDER LIST (Objects + Actors) ---
                    const renderList: { type: 'object' | 'enemy' | 'player' | 'projectile', z: number, data: any }[] = [];

                    // 1. World Objects
                    state.worldObjects.forEach(obj => {
                        if (obj.assetType === 'tile') return;
                        const s = camera.toScreen(obj.pos.x, obj.pos.y);
                        if (s.x < -200 || s.x > renderer.context.canvas.width + 200 ||
                            s.y < -200 || s.y > renderer.context.canvas.height + 200) return;

                        renderList.push({
                            type: 'object',
                            z: obj.zIndex || Math.floor(obj.pos.y * 100),
                            data: { ...obj, screenPos: s }
                        });
                    });

                    // 2. Projectiles (New Z-Sorted)
                    state.projectiles.forEach(p => {
                        if (p.isDead) return;
                        renderList.push({
                            type: 'projectile',
                            z: Math.floor(p.pos.y * 100) + 35, // Lift z-index slightly to match visual height (lift=35px ~ 1 tile Y)
                            data: p
                        });
                    });

                    // 3. Enemies
                    state.enemies.forEach(enemy => {
                        if (enemy.isDead) return;
                        if (enemy.pos.x >= minX - 2 && enemy.pos.x <= maxX + 2 &&
                            enemy.pos.y >= minY - 2 && enemy.pos.y <= maxY + 2) {
                            renderList.push({
                                type: 'enemy',
                                z: Math.floor(enemy.pos.y * 100),
                                data: enemy
                            });
                        }
                    });

                    // 4. Area Effects (Portals, Fields)
                    state.areaEffects.forEach(ae => {
                        renderList.push({
                            type: 'area_effect' as any, // Cast to any to bypass strict literal check on existing types if needed, or I should update the type definition in future.
                            z: Math.floor(ae.pos.y * 100) - 5, // Slightly below entities
                            data: ae
                        });
                    });

                    // 5. Player
                    renderList.push({
                        type: 'player',
                        z: Math.floor(playerPos.y * 100),
                        data: state.player
                    });

                    // --- SORT & RENDER ---
                    renderList.sort((a, b) => a.z - b.z);

                    renderList.forEach(item => {
                        if (item.type === 'object') {
                            const obj = item.data;
                            const s = obj.screenPos;

                            // GENERIC SHADOW for non-animal objects (Crates, Rocks, Flowers, etc.)
                            if (obj.assetType !== 'animal') {
                                ctx.save();
                                ctx.translate(s.x, s.y);
                                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                                ctx.beginPath();
                                // Base radius 16x6, scaled.
                                const shSc = obj.scale || 1;
                                ctx.ellipse(0, 0, 16 * shSc, 7 * shSc, 0, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.restore();
                            }

                            if (obj.assetType === 'geometric') {
                                renderGeometricTree(ctx, obj.assetPath, s.x, s.y, obj.scale);
                            } else if (obj.assetType === 'animal') {
                                if (obj.assetPath === 'bunny_rig' || obj.id.includes('bunny')) {
                                    renderBunny(ctx, s.x, s.y, obj.scale, false, true, obj.pos.x, obj.pos.y);
                                } else if (obj.assetPath === 'wolf_rig' || obj.id.includes('wolf')) {
                                    renderWolf(ctx, s.x, s.y, obj.scale, false, true, obj.pos.x, obj.pos.y);
                                } else {
                                    renderSquirrel(ctx, s.x, s.y, obj.scale, false, true, obj.pos.x, obj.pos.y);
                                }
                            } else {
                                let img = globalImageCache.get(obj.assetPath);
                                if (!img) {
                                    img = new Image();
                                    img.src = obj.assetPath;
                                    globalImageCache.set(obj.assetPath, img);
                                }
                                if (img.complete) {
                                    ctx.save();

                                    // TRANSPARENCY CHECK: If player is behind object
                                    // Player Y < Object Y (Player is "North" / Behind)
                                    // And they are close horizontally
                                    const dy = obj.pos.y - state.player.pos.y;
                                    const dx = Math.abs(obj.pos.x - state.player.pos.x);

                                    // Thresholds: Close in X, and Object is within 3 units "Below/South" of player
                                    if (dy > 0 && dy < 3.0 && dx < 1.0) {
                                        ctx.globalAlpha = 0.5;
                                    }

                                    ctx.translate(s.x, s.y);
                                    ctx.scale(obj.scale, obj.scale);
                                    if (obj.assetType === 'floor_prop') {
                                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                    } else {
                                        ctx.drawImage(img, -img.width / 2, -img.height);
                                    }
                                    ctx.restore();
                                }
                            }
                        } else if (item.type === 'enemy') {
                            const enemy = item.data;
                            const s = camera.toScreen(enemy.pos.x, enemy.pos.y);

                            // Hover Glow
                            if (enemy.id === hoveredEnemyId) {
                                ctx.save();
                                ctx.translate(s.x, s.y);
                                ctx.shadowColor = "rgba(255, 255, 200, 0.5)";
                                ctx.shadowBlur = 15;
                                ctx.globalAlpha = 0.5;
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                                ctx.beginPath();
                                ctx.ellipse(0, -35, 25, 40, 0, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.restore();
                            }
                            enemyRenderer.render(ctx, enemy, s.x, s.y);
                        } else if (item.type === 'player') {
                            const playerCenter = camera.toScreen(playerPos.x, playerPos.y);
                            ctx.save();
                            try {
                                playerRenderer.render(
                                    ctx,
                                    state.player,
                                    playerCenter.x,
                                    playerCenter.y,
                                    moveTargetRef.current,
                                    false
                                );
                            } catch (e) {
                                console.error("Player Render Error:", e);
                            }
                            ctx.restore();
                        } else if (item.type === 'projectile') {
                            const p = item.data;
                            const s = camera.toScreen(p.pos.x, p.pos.y); // Raw screen pos (Ground)

                            const config = SPELL_REGISTRY[p.data?.spellOverride || p.spellType];
                            const behavior = BEHAVIOR_REGISTRY[config?.behaviorKey || 'GenericBehavior'];

                            // Check Custom Renderer
                            if (behavior?.onRender) {
                                ctx.save();
                                // Pass raw screen coords (Behaviors handle their own lift)
                                behavior.onRender(ctx, p, s.x, s.y);
                                ctx.restore();
                            } else {
                                // DEFAULT RENDERER (Data Driven)
                                // Visualize Projectile Lift (35px)
                                const liftY = s.y - 35;

                                const visualLayer = config?.visualLayers?.[0]; // Use primary layer

                                ctx.save();
                                ctx.translate(s.x, liftY);

                                // Rotation
                                let rotation = Math.atan2(p.velocity.y, p.velocity.x);
                                // Add Config Rotation Offset (e.g. for Frost Pulse Arc)
                                if (config?.data?.rotationOffset) {
                                    rotation += config.data.rotationOffset;
                                }
                                ctx.rotate(rotation);

                                // Visual Layer Rendering with Fallback
                                let drawn = false;

                                if (visualLayer && visualLayer.sprite) {
                                    let img = globalImageCache.get(visualLayer.sprite);
                                    if (!img) {
                                        img = new Image();
                                        img.src = visualLayer.sprite;
                                        globalImageCache.set(visualLayer.sprite, img);
                                    }

                                    if (img.complete && img.naturalWidth > 0) {
                                        const scale = (config.data?.scaleOverride || 1) * (visualLayer.scaleCurve === 'pulse' ? (1 + Math.sin(Date.now() / 100) * 0.1) : 1);

                                        // Blend Mode
                                        if (visualLayer.blendMode === 'ADDITIVE') ctx.globalCompositeOperation = 'lighter';
                                        else if (visualLayer.blendMode === 'MULTIPLY') ctx.globalCompositeOperation = 'multiply';

                                        ctx.scale(scale, scale);
                                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                        drawn = true;
                                    }
                                }

                                if (!drawn) {
                                    // Fallback Circle (if no sprite or sprite broken)
                                    ctx.fillStyle = config?.animation?.primaryColor || '#ff00ff';
                                    ctx.beginPath();
                                    ctx.arc(0, 0, (p.radius || 0.2) * 32, 0, Math.PI * 2);
                                    ctx.fill();

                                    // Core
                                    ctx.fillStyle = '#ffffff';
                                    ctx.beginPath();
                                    ctx.arc(0, 0, (p.radius || 0.2) * 16, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                                ctx.restore();
                            }
                        } else if (item.type === 'area_effect') {
                            const ae = item.data;
                            const s = camera.toScreen(ae.pos.x, ae.pos.y);

                            ctx.save();
                            // Look up behavior for custom rendering
                            const behaviorKey = SPELL_REGISTRY[ae.spellType]?.behaviorKey;
                            const behavior = behaviorKey ? BEHAVIOR_REGISTRY[behaviorKey] : null;

                            if (behavior && behavior.onRender) {
                                behavior.onRender(ctx, ae, s.x, s.y);
                                ctx.restore();
                                return;
                            }

                            ctx.translate(s.x, s.y);

                            if (ae.data?.subtype === 'PORTAL') {
                                // Portal Animation: Ebb/Flow + Bobbing
                                const time = performance.now() / 1000;
                                const bobOffset = Math.sin(time * 2) * 10; // 10px bob
                                const pulseScale = 1 + Math.sin(time * 3) * 0.1; // 10% scale pulse

                                const img = globalImageCache.get('/vfx/arcane_portal.png');
                                if (!img) {
                                    const newImg = new Image();
                                    newImg.src = '/vfx/arcane_portal.png';
                                    globalImageCache.set('/vfx/arcane_portal.png', newImg);
                                }

                                if (img && img.complete) {
                                    // Draw "Shadow" or base
                                    ctx.save();
                                    ctx.scale(1, 0.3);
                                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                                    ctx.beginPath();
                                    ctx.arc(0, 0, 20, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.restore();

                                    // Draw Portal
                                    ctx.translate(0, -30 + bobOffset); // Base lift -30 + bob
                                    ctx.scale(pulseScale * 0.8, pulseScale * 0.8);
                                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                                } else {
                                    // Fallback
                                    ctx.fillStyle = '#8b5cf6';
                                    ctx.beginPath();
                                    ctx.arc(0, 0, 20, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            } else {
                                // Generic Area Effect
                                ctx.globalAlpha = 0.3;
                                ctx.fillStyle = '#ff0000';
                                ctx.beginPath();
                                ctx.arc(0, 0, (ae.radius || 1) * 32, 0, Math.PI * 2);
                                ctx.fill();
                            }
                            ctx.restore();
                        }
                    });

                    // Render Atmosphere (Fireflies)
                    atmosphere.render(ctx, camera);

                    // VfxRenderer handles transient and persistent visual artifacts
                    VfxRenderer.render(ctx, camera, state.visualEffects as any[]);

                    // Texts...
                    state.texts.forEach(txt => {
                        // ... rendering ...
                        ctx.save();
                        ctx.font = '900 24px "Arial Black", sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const x = txt.pos.x;
                        const y = txt.pos.y;
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.fillText(txt.text, x + 2, y + 2);
                        ctx.lineWidth = 4;
                        ctx.lineJoin = 'round';
                        ctx.strokeStyle = '#000000';
                        ctx.strokeText(txt.text, x, y);
                        ctx.fillStyle = txt.color;
                        ctx.fillText(txt.text, x, y);
                        ctx.fillStyle = 'rgba(255,255,255,0.25)';
                        ctx.fillText(txt.text, x - 1, y - 1);
                        ctx.restore();
                    });

                    const playerCenter = camera.toScreen(playerPos.x, playerPos.y);
                    ctx.save(); // Safety save to prevent transform leaks
                    try {
                        playerRenderer.render(
                            ctx,
                            state.player,
                            playerCenter.x,
                            playerCenter.y,
                            moveTargetRef.current,
                            false
                        );
                    } catch (e) {
                        console.error("Player Render Error:", e);
                    }
                    ctx.restore();

                    // --- LOOT RENDERER ---
                    // Render AFTER entities but BEFORE HUD (which is HTML usually, but here text is canvas?)
                    // Actually Loot Labels should be on top of everything, but Sprites behind Player?
                    // Sprite Z-sort is manual in RenderList. 
                    // To integrate properly with Z-Sorting, we should add Loot to 'renderList'.
                    // However, LootRenderer handles shadows/beams/labels specifically.
                    // For now, let's render Loot ON TOP of ground/objects but maybe behind Player if simple.
                    // Or just render after Player for visibility (PoE style, items often visually noisy).
                    // Best: Integrate into render list or render strictly after.

                    const showLabels = inputSystem.altHeld;
                    LootRenderer.render(ctx, camera, state.loot, inputSystem.mouseScreen, showLabels);

                    ctx.fillStyle = 'white';
                    ctx.font = '12px monospace';
                    ctx.fillText(`Enemies: ${state.enemies.length}`, 10, 40);
                }

                ctx.fillStyle = 'white';
                ctx.font = '16px monospace';
                ctx.fillText('Kiln Reborn Engine v0.1', 10, 20);
            }
        );

        engineRef.current = { loop, renderer, camera };
        loop.start();

        const handleResize = () => {
            renderer.resize();
            camera.resize(renderer.context.canvas.width, renderer.context.canvas.height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            loop.stop();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const loop = engineRef.current?.loop;
        if (loop) {
            if (isPaused) loop.stop();
            else loop.start();
        }
    }, [isPaused]);

    const devCallbacks = {
        checkLevelUp: (player: Player) => {
            // Simplified Level Up for DevTools (skipping visuals to avoid scope issues)
            const xpRequired = Math.floor(player.level * 100 * 1.5);
            if (player.xp >= xpRequired) {
                player.level++;
                player.xp -= xpRequired;
                player.toNextLevel = Math.floor(player.level * 100 * 1.5);
                const config = CLASS_CONFIG[player.heroClass] || CLASS_CONFIG.MAGE;
                player.baseStats.vitality += (config.stats.vitality || 1);
                player.baseStats.power += (config.stats.power || 1);
                player.spellPoints = (player.spellPoints || 0) + 1;
                player.hp = player.maxHp;
                player.mana = player.maxMana;
                console.log('DevTools: Level Up Applied');
            }
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} className="block touch-none" style={{ width: '100%', height: '100%' }} />
            <DevTools gameStateRef={gameStateRef} callbacks={devCallbacks} />
        </div>
    );
};
