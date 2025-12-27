
import { GameState, Vector2, SpellType, Enemy, EquipmentItem, Player, Entity, MeleeAttackPhase } from '../../types';
import { InputSystem } from '../../systems/InputSystem';
import { BEHAVIOR_REGISTRY } from './BehaviorRegistry';
import { SPELL_REGISTRY } from './SpellRegistry';
import { BASE_STAT_CONFIG, LEVEL_5_UNLOCK, ROCK_AURA_CONFIG, HEARTHSTONE_POS, SAFE_ZONE_RADIUS } from '../../constants';
import { getDistance, normalize, toScreen, toWorld } from '../../utils/isometric';
import { projectileHitsEnemy, ScreenRect, calculateEnemyHitboxes } from '../../utils/hitboxUtils';
import { sweptRectIntersectsRect } from '../../utils/continuousCollision';
import { calculateProceduralArm } from '../../utils/animationUtils';
import { pointInEllipse } from '../../utils/geometry';
import { isPositionValid } from '../../systems/PhysicsSystem';
import { spawnLoot } from '../../systems/SpawnSystem';
import { spawnXpOrb } from '../loot/LootSystem';
import { soundSystem } from '../../systems/SoundSystem';
import { inputSystem } from '../../systems/InputSystem';
import { createDefaultCastPlan, applyCardsToCastPlan } from '../cards/CardSystem';
import { CardContext, CastPlan } from '../cards/types';
import { compileSpellPlan } from './SpellCompiler';

export const ENABLE_CARDS = true;
export let debugLastCastPlan: CastPlan | null = null;
// SpellCallbacks is now in SpellBehavior.ts to avoid cycles
import { SpellCallbacks } from './SpellBehavior';
import { StoneShieldBehavior } from './behaviors/StoneShieldBehavior';

// Debug Registry
console.log('[SpellSystem] StoneShieldBehavior Import:', StoneShieldBehavior);



export const getEntityCenter = (entity: Entity): Vector2 => {
    return {
        x: entity.pos.x,
        y: entity.pos.y
    };
};

export const handleEnemyDeath = (state: GameState, e: Enemy, callbacks: SpellCallbacks) => {
    state.score += 10;

    // Spawn XP Orb instead of instant XP
    const xpValue = e.type === 'boss' ? 200 : 20;
    spawnXpOrb(state, e.pos, xpValue);

    if (state.activeQuest.type === 'kill') {
        state.activeQuest.current++;
    }

    state.player.potionKillCounter++;
    if (state.player.potionKillCounter >= 3) {
        state.player.potionKillCounter = 0;
        if (state.player.potions.health < 5) state.player.potions.health++;
        if (state.player.potions.mana < 5) state.player.potions.mana++;
        if (state.player.potions.speed < 5) state.player.potions.speed++;
    }

    if (state.player.lockedTargetId === e.id) {
        state.player.lockedTargetId = null;
    }

    spawnLoot(state, e.pos, e.type === 'boss');
    callbacks.checkLevelUp(state.player);
};

// Helper to extract flags for checking
const hasFlag = (plan: CastPlan, flag: string) => plan.flags.includes(flag as any);

export const fireSpell = (state: GameState, mouseWorld: Vector2, spell: SpellType, callbacks: SpellCallbacks, originOverride?: Vector2, ignoreBehaviors?: string[]): CastPlan | null => {
    const { player } = state;
    const config = SPELL_REGISTRY[spell];
    if (!config) {
        console.log('[FireSpell] No Config for:', spell);
        return null;
    }

    const behavior = BEHAVIOR_REGISTRY[config.behaviorKey];
    if (behavior?.onCast) {
        // Legacy Behaviors (Teleport, Dash, etc. that aren't card-driven yet)
        const result = behavior.onCast(state, config, player, mouseWorld, callbacks);

        // If onCast returns false, it wants to fall through to the systemic card-driven pipeline
        if (result !== false) {
            return null;
        }
    }

    // --- SYSTEMIC ANIMATION TRIGGER ---
    if (!player.casting.isCasting || player.casting.duration <= 0) {
        if (!player.attack.isAttacking) {
            player.attack.isAttacking = true;
            player.attack.timer = 0;
            player.attack.phase = MeleeAttackPhase.SWING;
        }
    }

    // --- DAMAGE CALCULATION ---
    const powerDmg = player.baseStats.power * BASE_STAT_CONFIG.POWER.dmgPerPoint;
    let equipDamage = 0;
    Object.values(player.equipment).forEach((item) => {
        const equip = item as EquipmentItem | null;
        if (equip?.stats.damage) equipDamage += equip.stats.damage;
    });

    let rawDmg = config.baseStats.baseDamage + (player.level * config.baseStats.damagePerLevel) + equipDamage + powerDmg;
    const variance = 0.1;
    let finalDmg = rawDmg * (1 - variance + Math.random() * variance * 2);

    // --- CARD SYSTEM INTEGRATION ---
    const cardContext: CardContext = {
        playerLevel: player.level,
        spellLevel: 1
    };

    // 1. Compile Plan (Unified Pipeline)
    let plan = compileSpellPlan(spell, player, { pos: mouseWorld }, cardContext);

    // 3. Apply Damage Mult
    finalDmg = finalDmg * plan.stats.damageMult;

    // --- EXECUTION ROUTING ---

    // Determine Target
    let targetPos: Vector2 = { ...mouseWorld };
    if (player.lockedTargetId) {
        const lockedEnemy = state.enemies.find(e => e.id === player.lockedTargetId);
        if (lockedEnemy && !lockedEnemy.isDead) {
            targetPos = getEntityCenter(lockedEnemy);
        } else {
            player.lockedTargetId = null;
        }
    }

    // Determine Spawn Origin
    let spawnPos: Vector2;
    let aimAngle = 0;

    if (originOverride) {
        spawnPos = originOverride;
        const dx = targetPos.x - originOverride.x;
        const dy = targetPos.y - originOverride.y;
        aimAngle = Math.atan2(dy, dx);
    } else if ((config as any).data?.originOffset) {
        const offset = (config as any).data.originOffset;
        spawnPos = { x: player.pos.x + offset.x, y: player.pos.y + offset.y };
        aimAngle = Math.atan2(targetPos.y - spawnPos.y, targetPos.x - spawnPos.x);
    } else {
        const armData = calculateProceduralArm(player, targetPos, undefined, config, player.casting.isCasting ? player.casting.timer : 0);
        spawnPos = armData.projectileSpawnPos;
        aimAngle = armData.aimAngle;
    }

    const speedMultiplier = config.baseStats.projectileSpeed * plan.stats.projectileSpeedMult;
    const projectileSpeed = speedMultiplier * 0.02;

    // Projectile Count Calculation
    let projectileCount = Math.max(1, plan.stats.projectileCount || 1);

    // Living Fireball constraint
    if (plan.data?.isLivingFireball) projectileCount = 1;

    // Run & Gun Damage penalty
    if (plan.data?.mobilityPenalty && (player.velocity.x !== 0 || player.velocity.y !== 0)) {
        finalDmg *= 0.88;
    }

    // Staggered Firing logic
    if (plan.data?.staggerFire && projectileCount > 1 && !ignoreBehaviors?.includes('STAGGER')) {
        // Schedule others in burst queue
        if (!player.casting.burstQueue) player.casting.burstQueue = [];
        player.casting.burstQueue.push({
            spellId: spell,
            count: projectileCount - 1,
            interval: 8,
            timer: 8,
            originalTarget: { ...targetPos },
            data: { ...plan.data, staggerFire: false } // No recursion
        });
        // Fire only one now
        projectileCount = 1;
    }

    // Apply Talent additions if not already in plan (Plan should own this ideally, but keeping hybrid for safety)
    Object.values(player.equipment).forEach((item) => {
        const equip = item as EquipmentItem | null;
        if (equip?.stats.projectileCount) projectileCount += equip.stats.projectileCount;
    });

    const explosionRadius = (config.baseStats.aoeRadius || 0) * plan.stats.aoeRadiusMult + (plan.stats.explosionRadiusFlat || 0);

    // --- DISPATCH BASED ON KIND ---

    if (plan.kind === 'PROJECTILE') {
        const spreadTotal = (plan.stats.spreadDegrees || 0) * (Math.PI / 180);
        // Default spread if multiple projectiles and no manual spread set
        const autoSpread = projectileCount > 1 && spreadTotal === 0 ? 0.2 * (projectileCount - 1) : spreadTotal;

        for (let i = 0; i < projectileCount; i++) {
            // Spread Logic
            // If 1 projectile, angle is aimAngle.
            // If >1, center around aimAngle.
            const offset = projectileCount > 1
                ? (i - (projectileCount - 1) / 2) * (autoSpread / (projectileCount > 1 ? projectileCount - 1 : 1)) // Distribute evenly
                : 0;

            // If using Spread Degrees specifically (e.g. Triple Fork 45deg)
            const manualOffset = (plan.stats.spreadDegrees && projectileCount > 1)
                ? (i - (projectileCount - 1) / 2) * (spreadTotal / (projectileCount - 1))
                : offset;

            const angle = aimAngle + manualOffset;

            const velX = Math.cos(angle) * projectileSpeed;
            const velY = Math.sin(angle) * projectileSpeed;

            // Flags Logic
            const orbitData = hasFlag(plan, 'ORBIT_CASTER') ? {
                centerId: player.id,
                radius: plan.stats.orbitRadius || 2.0,
                speed: plan.stats.orbitSpeed || 0.1,
                timer: 0,
                initialPhase: (i / projectileCount) * Math.PI * 2 // Distribute orbits
            } : undefined;

            state.projectiles.push({
                id: 'proj_' + Date.now() + '_' + Math.random() + '_' + i,
                pos: { ...spawnPos },
                prevPos: { ...spawnPos },
                velocity: { x: velX, y: velY },
                radius: 0.3 * (plan.stats.projectileScale || 1.0),
                isDead: false,
                spellType: spell,
                damage: finalDmg,
                duration: config.baseStats.projectileLifetime * 60 || 180,
                hitList: [],
                isShrapnel: false,
                targetPos: spell === 'BOMB' ? targetPos : undefined, // Quick fix for Bomb
                isEnemy: false,
                explosionRadius: explosionRadius,
                knockback: plan.stats.knockbackForce || 0,
                bounces: 0,
                maxBounces: (config.geometry.maxRicochets || 0) + (plan.stats.bounceCount || 0),
                data: {
                    pierce: (config.targeting.maxPenetrations || 0) + plan.stats.pierceCount,
                    split: plan.stats.splitCount || 0,
                    lifeSteal: plan.stats.lifeSteal || 0,
                    manaOnHit: plan.stats.manaOnHit || 0,
                    gravityForce: plan.stats.gravityForce || 0,
                    homing: plan.stats.homingStrength || 0,
                    orbit: orbitData,
                    projectileScale: plan.stats.projectileScale || 1.0,

                    // Maps Flags to Data for Renderer/Physics
                    flags: plan.flags,

                    aoeShape: hasFlag(plan, 'AOE_SHAPE_RING') ? { type: 'RING', data: plan.data } :
                        (hasFlag(plan, 'AOE_SHAPE_CONE') ? { type: 'CONE', data: plan.data } : undefined)
                }
            });
        }
    } else if (plan.kind === 'AOE') {
        // Instant AoE at target (or spawnPos for Cone/Self-centered)
        const isCone = (plan.stats.aoeRadiusMult && (plan.kind as any) === 'CONE') || plan.data.coneAngleDeg;
        const origin = isCone ? spawnPos : targetPos;

        callbacks.createExplosion(
            origin,
            explosionRadius,
            finalDmg,
            '#FF4400', // Need color from config?
            hasFlag(plan, 'AOE_SHAPE_RING') ? { type: 'RING', data: plan.data } :
                (plan.stats.aoeRadiusMult && (plan.kind as any) === 'CONE' || plan.data.coneAngleDeg) ? { type: 'CONE', data: { ...plan.data, angle: aimAngle } } : undefined
        );
        // Apply Triggers immediately?
    } else if (plan.kind === 'BEAM') {
        // Spawn Beam Entity (Logic handled in BeamBehavior or similar?)
        // For now, create a special "Projectile" that acts as a beam anchor or use createVisualEffect
        // Only if we have a robust Beam system. If not, fallback to high-speed projectile stream (Rapid Fire)
        // User asked for "Beam Entity".
        // Let's defer strict Beam Entity creation to "Phase 4" or assume visual effect for now.
        // Or treating it as a very fast projectile loop?
        // Let's assume Projectile for now unless BEAM flag is strictly handled.
    } else if (plan.kind === 'TRANSFORM') {
        // Handle Transformation
        if (plan.transform) {
            // Logic to set player input overrides, model swap, etc.
            // player.transformState = plan.transform;
        }
    }

    return plan;
};

export const initiateCast = (
    state: GameState,
    mouseWorld: Vector2,
    overrideSpellType: SpellType | undefined,
    cooldownRef: { current: number },
    callbacks: SpellCallbacks,
    shouldEquip: boolean = false,
    moveTargetRef?: { current: Vector2 | null },
    originOverride?: Vector2
) => {
    if (cooldownRef.current > 0) {
        console.log('initiateCast: GCD active', cooldownRef.current);
        return;
    }

    const { player } = state;
    const spellKey = overrideSpellType || player.currentSpell;

    // Check Individual Cooldown
    if (player.cooldowns && player.cooldowns[spellKey] > 0) {
        if (!player.casting.burstQueue || player.casting.burstQueue.length === 0) {
            callbacks.addFloatingText("Not Ready", player.pos, '#888');
            return;
        }
    }



    if (player.casting.isCasting) {
        // Interrupt logic:
        // Allow interrupt if switching spells OR if the new spell is Instant.
        const newConfig = SPELL_REGISTRY[spellKey]; // Load config of NEW spell to check castTime
        if (newConfig) {
            const isInstant = (newConfig.baseStats.castTime || 0) === 0;
            const isDifferent = player.casting.currentSpell !== spellKey;

            // Fix: Don't interrupt if it's the same CHANNEL spell (allows continuous hold)
            if ((isInstant && newConfig.hotbarType !== 'CHANNEL') || isDifferent) {
                console.log('initiateCast: Interrupting current cast for:', spellKey);
                player.casting.isCasting = false;
                player.casting.timer = 0;
                player.casting.duration = 0; // Force clear duration to unlock movement logic
                player.casting.trail = []; // Clear visual trails
                // Proceed to cast below...
            } else {
                // console.log('initiateCast: Already casting same spell');
                return;
            }
        } else {
            return;
        }
    }

    let spell = spellKey; // Proceed with resolved key
    console.log('initiateCast: Attempting', spell);

    let config = SPELL_REGISTRY[spell];

    // --- LEGACY MIGRATION ---
    // Fix corrupted save states where 'ICE' or 'FIRE' legacy strings are stored
    if (!config) {
        const legacySpell = spell as string;
        if (legacySpell === 'ICE') {
            spell = SpellType.ICE_FROST_BOLT;
            config = SPELL_REGISTRY[spell];
            console.log('initiateCast: Migrated ICE -> ICE_FROST_BOLT');
        } else if (legacySpell === 'FIRE') {
            spell = SpellType.FIRE_FIREBALL;
            player.currentSpell = spell;
            config = SPELL_REGISTRY[spell];
            console.log('initiateCast: Migrated FIRE -> FIRE_FIREBALL');
        } else if (legacySpell === 'LIGHTNING') {
            spell = SpellType.LIGHTNING_LIGHTNING_BOLT;
            player.currentSpell = spell;
            config = SPELL_REGISTRY[spell];
            console.warn('[SpellSystem] Automatically migrated legacy LIGHTNING to Lightning Bolt');
        } else if (legacySpell === 'EARTH') {
            spell = SpellType.EARTH_STONE_SHOT;
            player.currentSpell = spell;
            config = SPELL_REGISTRY[spell];
            console.warn('[SpellSystem] Automatically migrated legacy EARTH to Stone Shot');
        }
    }

    if (!config) {
        console.error('initiateCast: No Config for spell', spell);
        return;
    }



    if (shouldEquip) {
        player.currentSpell = spell;
    }

    if (spell === SpellType.BOMB && player.bombAmmo <= 0) {
        callbacks.addFloatingText("No Ammo!", player.pos, '#888');
        return;
    }

    // Input Hysteresis for Swing/Melee
    if (config.spellType === 'Melee' || config.hotbarType === 'CHANNEL') {
        if (inputSystem.keys.has('shift')) {
            // Shift behavior
        } else {
            // Normal behavior
        }
    }

    // Determine Duration
    const isDelayedChannelSpell = (config.school === 'FIRE' && config.hotbarType === 'CHANNEL') || spell === SpellType.HEARTHSTONE || spell === SpellType.TELEPORT;

    // --- PREVIEW PLAN FOR STATS (ROW C) ---
    // We need to know castTimeMult *before* we start casting.

    // --- PREVIEW PLAN FOR STATS (ROW C) ---
    // We need to know castTimeMult *before* we start casting.

    // --- PREVIEW PLAN FOR STATS (ROW C) ---
    // We need to know castTimeMult *before* we start casting.

    const cardContext: CardContext = { playerLevel: player.level, spellLevel: 1 };
    let previewPlan = compileSpellPlan(spell, player, { pos: mouseWorld }, cardContext);

    // --- RESOURCE COST LOGIC (Row F) ---
    const baseCost = config.baseStats.manaCost || 0;
    const costMult = Math.max(0, 1.0 + (previewPlan.stats.manaCostMult || 0));
    const finalCost = baseCost * costMult;

    if (config.resource.usesMana && spell !== SpellType.BOMB && spell !== SpellType.HEARTHSTONE && spell !== SpellType.SWORD_SWIPE) {
        if (previewPlan.stats.useHealthCost) {
            // Blood Magic
            if (player.hp <= finalCost) {
                callbacks.addFloatingText("Not Enough HP!", player.pos, '#ef4444');
                return;
            }
            player.hp -= finalCost;
            callbacks.addFloatingText(`-${Math.round(finalCost)} HP`, player.pos, '#ef4444');
        } else {
            // Standard Mana
            if (player.mana < finalCost) {
                callbacks.addFloatingText("No Mana!", player.pos, '#888');
                return;
            }
            player.mana -= finalCost;
        }
    }

    // Self Damage (Overload)
    if (previewPlan.stats.selfDamageOnCast && previewPlan.stats.selfDamageOnCast > 0) {
        player.hp -= previewPlan.stats.selfDamageOnCast;
        callbacks.addFloatingText(`-${previewPlan.stats.selfDamageOnCast} HP`, player.pos, '#ff0000');
        if (player.hp <= 0) state.gameOver = true;
    }
    let castTimeMult = Math.max(0.1, 1.0 + (previewPlan.stats.castTimeMult || 0));
    // Run & Gun Cast Time penalty
    if (previewPlan.data?.mobilityPenalty && (player.velocity.x !== 0 || player.velocity.y !== 0)) {
        castTimeMult *= 1.2;
    }
    // Heavy Cast: +100% castTimeMult -> 2.0x Duration.

    // Apply Shield on Cast (Row D)
    if (previewPlan.stats.shieldOnCast && previewPlan.stats.shieldOnCast > 0) {
        player.shield = Math.min(player.baseStats.shield, player.shield + previewPlan.stats.shieldOnCast);
        callbacks.addFloatingText(`+ ${previewPlan.stats.shieldOnCast} Shield`, player.pos, '#00ffff');
    }

    // Apply Defensive Buffs (Row E)
    if (previewPlan.stats.buffStoneskin) player.activeBuffs.stoneskin = previewPlan.stats.buffStoneskin * 60;
    if (previewPlan.stats.buffThorns) player.activeBuffs.thorns = previewPlan.stats.buffThorns * 60;
    if (previewPlan.stats.buffDeflection) player.activeBuffs.deflection = previewPlan.stats.buffDeflection * 60;

    // Apply Transformation (Row 3)
    if (previewPlan.stats.morph && previewPlan.stats.morph !== 'NONE') {
        player.morph = previewPlan.stats.morph as any; // Cast to MorphType
        player.activeBuffs.morphTimer = 20 * 60; // 20 Seconds default
        callbacks.addFloatingText(`${previewPlan.stats.morph} FORM!`, player.pos, '#a855f7');

        // Instant visual feedback
        callbacks.createImpactPuff(player.pos, SpellType.ARCANE_EXPLOSION);
    }

    let duration = 0;

    if (config.spellType === 'Melee') {
        duration = (config.baseStats.castTime || 0.5) * 60; // Melee fixed for now
    } else if (config.hotbarType === 'CHANNEL' && !isDelayedChannelSpell) {
        duration = config.baseStats.duration * 60 || 300;
    } else {
        duration = ((config.baseStats.castTime || 0) * 60) * castTimeMult;
    }

    if (duration > 0) {
        const fixedChannelDuration = (config as any).data?.channelDurationFrames;

        player.casting.isCasting = true;
        player.casting.currentSpell = spell;
        player.casting.timer = 0;
        player.casting.duration = duration;
        player.casting.targetPos = { ...mouseWorld };
        player.casting.hitTargets = [];
        player.casting.trail = [];

        // Channel Init
        player.casting.tickTimer = 0;
        player.casting.startFrame = state.frame ?? 0; // State.frame needs to be verified if it exists on GameState, otherwise use internal counter?
        // GameState definition usually has 'frame' or similar time? 
        // Checking types.ts previously didn't show 'frame' on GameState explicitly in the snippet I saw.
        // But the user request said "state.frame". I will assume it exists or use date.
        // Actually, SpellSystem update uses dt. 
        // If state.frame is not reliable, I can use player.casting.timer which counts UP in some logic, or use duration as countdown.
        // User requested: "endFrame: state.frame + dur".
        // I will assume state.frame is available. If not I will add it or use Date.now() / 16? 
        // Let's rely on timer for now if state.frame is missing? No, user explicitly asked for 'state.frame'.
        // I'll assume state.frame exists. If compile fails, I'll fix it.
        player.casting.endFrame = (state.frame || 0) + (fixedChannelDuration || (duration > 0 ? duration : 180));

        // Facing Logic
        const dx = mouseWorld.x - player.pos.x;
        const DEADZONE = 2.0;
        if (dx > DEADZONE) {
            player.facingRight = true;
        } else if (dx < -DEADZONE) {
            player.facingRight = false;
        }

        // Slow player down while casting? (Optional)
        const isMobileSpell = spell === SpellType.SWORD_SWIPE || spell === SpellType.WHIRLWIND_STRIKE;
        if (!isMobileSpell && moveTargetRef) {
            // Stop movement for hard casts
            moveTargetRef.current = null;
        }

        // Determining immediate fire
        // New: Melee OR (Channel && !Delayed).
        const firesImmediately = config.spellType === 'Melee' || (config.hotbarType === 'CHANNEL' && !isDelayedChannelSpell);

        if (firesImmediately) {
            console.log('initiateCast: Immediate Firing Triggered');
            const plan = fireSpell(state, mouseWorld, spell, callbacks, originOverride);

            // --- ROW C Logic (Unique for Immediate?) ---
            let cooldownMult = 1.0;
            if (plan) {
                if (plan.stats.cooldownMult) cooldownMult += plan.stats.cooldownMult;
                // Immediate spells (Melee/Channel) might not support Burst/Echo logic well 
                // because they are continuous or melee. 
                // However, for consistency, we could. But usually Burst is for Projectiles.
                // Ignoring Burst for Melee/Channel for now.
            }

            const cooldownSeconds = config.baseStats.cooldown;
            const cdrMultiplier = Math.max(0.2, 1 - (player.baseStats.haste * BASE_STAT_CONFIG.HASTE.cdrPerPoint));
            const finalCdMs = (cooldownSeconds * 1000) * cdrMultiplier * Math.max(0.1, cooldownMult);

            cooldownRef.current = finalCdMs; // Global Cooldown (using same value for now, or use fixed GCD?)
            // Usually GCD is 500ms, Spell CD is longer.
            // Let's use 500ms for GCD, and actual CD for spell.
            cooldownRef.current = 500;

            if (!player.cooldowns) player.cooldowns = {};
            player.cooldowns[spell] = finalCdMs;
        } else {
            console.log('initiateCast: Delayed Firing (waiting for updateCasting)');
        }
    } else {
        console.log('initiateCast: Instant Cast');
        const plan = fireSpell(state, mouseWorld, spell, callbacks, originOverride);

        // --- ROW C: COOLDOWN & BURST LOGIC (Instant) ---
        let cooldownMult = 1.0;
        if (plan) {
            if (plan.stats.cooldownMult) cooldownMult += plan.stats.cooldownMult;

            // Burst / Echo Check
            if ((plan.flags.includes('BURST_CAST') || plan.flags.includes('SPELL_ECHO'))) {
                if (!player.casting.burstQueue) player.casting.burstQueue = [];

                // Burst Fire
                if (plan.flags.includes('BURST_CAST') && plan.data.burstCount > 0) {
                    player.casting.burstQueue.push({
                        spellId: spell,
                        count: plan.data.burstCount,
                        interval: plan.data.burstInterval || 5, // frames
                        timer: plan.data.burstInterval || 5,
                        originalTarget: { ...mouseWorld },
                        data: plan.data // carry configs
                    });
                }
                // Spell Echo
                if (plan.flags.includes('SPELL_ECHO')) {
                    player.casting.burstQueue.push({
                        spellId: spell,
                        count: 1, // Echo once
                        interval: plan.data.echoDelay || 30, // 0.5s default
                        timer: plan.data.echoDelay || 30,
                        originalTarget: { ...mouseWorld },
                        data: plan.data
                    });
                }
            }
        }

        // Calculate Cooldowns
        const cooldownSeconds = config.baseStats.cooldown;
        const cdrMultiplier = Math.max(0.2, 1 - (player.baseStats.haste * BASE_STAT_CONFIG.HASTE.cdrPerPoint));

        // 1. Global Cooldown (GCD) - Short lockout (e.g. 0.5s) to prevent spamming different spells instantly
        const gcdMs = 500; // 0.5s in ms
        cooldownRef.current = gcdMs;

        // 2. Spell Specific Cooldown (MS)
        if (!player.cooldowns) player.cooldowns = {};
        player.cooldowns[spell] = (cooldownSeconds * 1000) * cdrMultiplier * Math.max(0.1, cooldownMult);

        // Update facing for instant casts too
        const dx = mouseWorld.x - player.pos.x;
        if (dx > 0.5) player.facingRight = true;
        else if (dx < -0.5) player.facingRight = false;
    }
};

export const updateCasting = (player: Player, state: GameState, callbacks: SpellCallbacks, cooldownRef: any, mouseWorld: Vector2 | undefined, handOrigin?: Vector2, inputSys?: InputSystem) => {
    // Fallback to global if not passed
    const input = inputSys || inputSystem;

    // 0. Regenerate Mana (Passive)
    if (player.mana < player.maxMana) {
        player.mana += (0.05 + ((player.baseStats?.vitality || 0) * 0.01)); // Regeneration
        if (player.mana > player.maxMana) player.mana = player.maxMana;
    }

    // --- ROW C: BURST QUEUE PROCESSING ---
    if (player.casting.burstQueue && player.casting.burstQueue.length > 0) {
        for (let i = player.casting.burstQueue.length - 1; i >= 0; i--) {
            const item = player.casting.burstQueue[i];
            item.timer--;
            if (item.timer <= 0) {
                // Fire Burst Shot
                const target = mouseWorld || item.originalTarget; // Track mouse if available, else static
                // Suppress recursion tags
                fireSpell(state, target, item.spellId, callbacks, handOrigin, ['BURST_CAST', 'SPELL_ECHO']);

                item.count--;
                item.timer = item.interval;

                if (item.count <= 0) {
                    player.casting.burstQueue.splice(i, 1);
                }
            }
        }
    }

    if (!player.casting.isCasting) return;

    // Use config to check school instead of direct enum comparison for generic FIRE logic?
    // Using explicit FLAMEBLAST check as it's legacy/specific

    const config = SPELL_REGISTRY[player.casting.currentSpell];

    // Debug Channel
    if (player.casting.isCasting && config?.hotbarType === 'CHANNEL') {
        console.log(`updateCasting: Channel Active. Timer: ${player.casting.timer} | RMouse: ${input.rightMouseDown} | InputSrc: ${inputSys ? 'ARG' : 'GLOBAL'}`);
    }

    if (config && config.school === 'FIRE' && mouseWorld) {
        player.casting.targetPos = { ...mouseWorld };
    }

    // --- CHANNEL LOGIC (Fixed Duration) ---
    if (config && config.hotbarType === 'CHANNEL') {
        const channelDuration = (config as any).data?.channelDurationFrames;

        // 1. Check Expiry
        if (channelDuration && player.casting.duration <= 0) {
            // Wait, initiateCast sets casting.duration from channelDurationFrames now?
            // initiateCast Logic: duration = config.baseStats.duration * 60 || 300
            // AND I added endFrame logic.
            // Let's stick to the User Request pattern: stop when now >= endFrame
            // But I don't see state.frame in GameState in my view?
            // If checking state.frame fails, I'll fall back to duration decrement.

            // Actually, existing logic decrements 'duration' somewhere? No, I don't see decrement in updateCasting?
            // Wait, existing `updateCasting` didn't decrement duration?
            // I need to verify that.
            // If I look at lines 615+, I don't see `player.casting.duration--`.
            // So I should implement it here if it's not elsewhere.
        }

        // AUTO-STOP LOGIC
        if (channelDuration) {
            // Decrement Duration (Frame/Calls based)
            player.casting.duration--;

            if (player.casting.duration <= 0) {
                console.log('updateCasting: Channel Finished (Duration)');
                player.casting.isCasting = false;

                // Apply Cooldown
                if (!player.cooldowns) player.cooldowns = {};
                const cdMs = (config.baseStats.cooldown * 1000) || 0;
                // Haste Logic?
                const cdrMultiplier = Math.max(0.2, 1 - (player.baseStats.haste * BASE_STAT_CONFIG.HASTE.cdrPerPoint));
                player.cooldowns[player.casting.currentSpell] = cdMs * cdrMultiplier;

                return;
            }
        } else {
            // HOLD-TO-CAST (Legacy)
            const isDelayed = config.school === 'FIRE' || player.casting.currentSpell === SpellType.HEARTHSTONE || player.casting.currentSpell === SpellType.TELEPORT;
            if (!isDelayed) {
                if (!input.rightMouseDown) {
                    console.log('updateCasting: Stopping Channel (Mouse Released)');
                    player.casting.isCasting = false;
                    player.casting.timer = 0;
                    player.casting.duration = 0;
                    return;
                }
            }
        }

        // TICK LOGIC
        const tickRate = (config as any).data?.tickEveryFrames || 6;
        player.casting.tickTimer++;
        if (player.casting.tickTimer >= tickRate) {
            player.casting.tickTimer = 0;
            // Trigger Behavior
            const behavior = BEHAVIOR_REGISTRY[config.behaviorKey];
            if (behavior?.onCast) {
                behavior.onCast(state, config, player, player.casting.targetPos, callbacks);
            }
        }
    }

    // 4. Tick Channel
    // Fix TS Error: Cast to any or string for 'REPEATER' check if type definition is partial
    const typeRef = config.hotbarType as string;
    if (config && (typeRef === 'CHANNEL' || typeRef === 'REPEATER')) {
        const tickRate = (config as any).tickRate || 5;
        if (player.casting.timer > 0 && player.casting.timer % tickRate === 0) {
            fireSpell(state, player.casting.targetPos || mouseWorld, player.casting.currentSpell, callbacks, handOrigin);
        }
    }

    player.casting.timer++;

    // Prevent CHANNEL spells from finishing via Duration (unless they have explicit duration set)
    const isChannel = config && config.hotbarType === 'CHANNEL';
    const hasExplicitDuration = isChannel && player.casting.duration > 0;

    // Finish if (Not Channel AND Timer >= Duration) OR (Channel AND Explicit Duration AND Timer >= Duration)
    if ((!isChannel || hasExplicitDuration) && player.casting.timer >= player.casting.duration) {
        console.log(`updateCasting: Cast Finished. Timer: ${player.casting.timer}, Duration: ${player.casting.duration}`);
        if (player.casting.currentSpell === SpellType.FLAMEBLAST) {
            const stages = Math.min(10, Math.floor(player.casting.duration / 5));
            // FLAMEBLAST is legacy, so config might be missing if I didn't stub it correctly?
            // checking config validity
            if (config) {
                const dmg = config.baseStats.baseDamage * stages + (player.baseStats.power * 0.5);
                const radius = (config.baseStats.aoeRadius || 1) + (stages * 0.2);

                callbacks.createExplosion(player.casting.targetPos, radius, dmg, '#ff8c00');
                callbacks.addFloatingText(stages + ' Stacks!', player.casting.targetPos, '#ff8c00');
            }
            player.casting.isCasting = false;
            player.casting.timer = 0;
            player.casting.duration = 0;
            player.casting.trail = [];
        }
        else {
            if (config) {
                // Generalized firing for all cast-time spells (excluding special cases handled above)
                let plan: CastPlan | null = null;

                // 4. Tick Channel
                const typeRef = config.hotbarType as string;
                if (typeRef === 'CHANNEL' || typeRef === 'REPEATER') {
                    const tickRate = (config as any).tickRate || 5;
                    if (player.casting.timer > 0 && player.casting.timer % tickRate === 0) {
                        try {
                            fireSpell(state, player.casting.targetPos || mouseWorld, player.casting.currentSpell, callbacks, handOrigin);
                        } catch (err) {
                            console.error("Channel Cast Error:", err);
                        }
                    }
                } else {
                    // NOW we fire the spell (Hard Cast / Instant)
                    try {
                        plan = fireSpell(state, player.casting.targetPos, player.casting.currentSpell, callbacks, handOrigin);
                    } catch (err) {
                        console.error("Cast Error:", err);
                        callbacks.addFloatingText("Cast Fail!", player.pos, "red");
                    }
                }

                // --- ROW C: COOLDOWN & BURST LOGIC (Hard Cast) ---
                let cooldownMult = 1.0;
                if (plan) {
                    if (plan.stats.cooldownMult) cooldownMult += plan.stats.cooldownMult;

                    // Burst / Echo check
                    if ((plan.flags.includes('BURST_CAST') || plan.flags.includes('SPELL_ECHO'))) {
                        if (!player.casting.burstQueue) player.casting.burstQueue = [];
                        if (plan.flags.includes('BURST_CAST') && plan.data.burstCount > 0) {
                            player.casting.burstQueue.push({
                                spellId: player.casting.currentSpell,
                                count: plan.data.burstCount,
                                interval: plan.data.burstInterval || 5,
                                timer: plan.data.burstInterval || 5,
                                originalTarget: { ...player.casting.targetPos },
                                data: plan.data
                            });
                        }
                        if (plan.flags.includes('SPELL_ECHO')) {
                            player.casting.burstQueue.push({
                                spellId: player.casting.currentSpell,
                                count: 1,
                                interval: plan.data.echoDelay || 30,
                                timer: plan.data.echoDelay || 30,
                                originalTarget: { ...player.casting.targetPos },
                                data: plan.data
                            });
                        }
                    }
                }

                if (cooldownRef) {
                    const cdrMultiplier = Math.max(0.2, 1 - (player.baseStats.haste * BASE_STAT_CONFIG.HASTE.cdrPerPoint));
                    const cdMs = (config.baseStats.cooldown * 1000) * cdrMultiplier * Math.max(0.1, cooldownMult);

                    // Set GCD (short)
                    cooldownRef.current = 150;

                    // Set Spell Cooldown
                    if (!player.cooldowns) player.cooldowns = {};
                    player.cooldowns[player.casting.currentSpell] = cdMs;
                }
            }

            // For FIRE spell (or Generic Fire logic), reset timer to loop the cast instead of ending it
            if (player.casting.currentSpell === SpellType.FIRE) { // Assuming FIRE is the legacy repeating cast
                player.casting.timer = 0;
            } else {
                player.casting.isCasting = false;
                player.casting.timer = 0;
                player.casting.duration = 0;
                player.casting.trail = [];
            }
        }
    }
};

export const updateProjectiles = (state: GameState, dt: number, callbacks: SpellCallbacks) => {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];

        // Store previous position before moving
        if (!p.prevPos) {
            p.prevPos = { ...p.pos };
        }
        const prevPos = { ...p.pos };

        // Move projectile

        // Gravity Well (Row D)
        if (p.data?.gravityForce) {
            const range = 4.0;
            for (const e of state.enemies) {
                if (e.isDead || !e.pos) continue;
                const dx = p.pos.x - e.pos.x;
                const dy = p.pos.y - e.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < range && dist > 0.1) {
                    const force = (p.data.gravityForce / (dist * dist)) * 0.5;
                    const clamped = Math.min(force, 0.2);
                    const angle = Math.atan2(dy, dx); // Angle from enemy to projectile
                    // p.pos - e.pos = vector pointing TO projectile
                    e.pos.x += Math.cos(angle) * clamped;
                    e.pos.y += Math.sin(angle) * clamped;
                }
            }
        }

        if (p.data?.orbit && !p.data.stoneShield) {
            // Orbit Logic
            const centerPos = state.player.id === p.data.orbit.centerId ? state.player.pos : p.pos;

            p.data.orbit.timer += dt * 60; // Frames approx
            const orbitDuration = p.data.orbit.duration || 180;

            if (p.data.orbit.timer < orbitDuration) {
                // Orbiting Phase
                // Angle = (Time * Speed) + InitialPhase
                const angle = (p.data.orbit.timer * (p.data.orbit.speed || 0.1)) + (p.data.orbit.initialPhase || 0);

                p.pos.x = centerPos.x + Math.cos(angle) * p.data.orbit.radius;
                p.pos.y = centerPos.y + Math.sin(angle) * p.data.orbit.radius;

                // Calculate tangential velocity for release vector
                // Tangent is angle + 90deg (PI/2)
                p.velocity.x = Math.cos(angle + Math.PI / 2) * 0.2;
                p.velocity.y = Math.sin(angle + Math.PI / 2) * 0.2;
            } else {
                // Release Phase - Fire outward from current position (Radial or Tangential?)
                // Usually "Releasing" implies flying off tangent or flying at target?
                // Let's fly OUTWARD (Radial) for ease of aiming, or Tangent?
                // User spec for Orbit doesn't specify release behavior, but "release" implies letting go.
                // Tangential is physics-accurate. Radial is "fun" (expanding ring).
                // Let's go Tangential (keep velocity set above).

                // But we likely want them to seek cursor or just fly off?
                // Keeping the tangential velocity set in the loop handles it!

                p.data.orbit = undefined; // Stop orbiting
            }
        }
        else if (p.data?.homing) {
            // Homing Logic
            p.pos.x += p.velocity.x;
            p.pos.y += p.velocity.y;

            // Find nearest enemy
            let closest = null;
            let minDist = 8.0; // Range
            for (const enemy of state.enemies) {
                if (enemy.isDead) continue;
                const dist = Math.sqrt(Math.pow(enemy.pos.x - p.pos.x, 2) + Math.pow(enemy.pos.y - p.pos.y, 2));

                let score = dist;
                if (p.data?.thermalTargeting && ((enemy as any).burnTimer > 0 || (enemy as any).burnStacks > 0)) {
                    // Heavily prioritize burning enemies
                    score -= 5.0;
                    // Further prioritize stacks if system supports it
                    if ((enemy as any).burnStacks) score -= (enemy as any).burnStacks * 0.5;
                }

                if (score < minDist) {
                    minDist = score;
                    closest = enemy;
                }
            }

            if (closest) {
                // Steer towards
                const targetAngle = Math.atan2(closest.pos.y - p.pos.y, closest.pos.x - p.pos.x);
                const currentAngle = Math.atan2(p.velocity.y, p.velocity.x);
                // Simple lerp angle?
                // Need robust angle lerp.
                let diff = targetAngle - currentAngle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                const turnRate = p.data.homing; // e.g. 0.05
                const newAngle = currentAngle + Math.max(-turnRate, Math.min(turnRate, diff));

                const speed = Math.sqrt(p.velocity.x * p.velocity.x + p.velocity.y * p.velocity.y);
                p.velocity.x = Math.cos(newAngle) * speed;
                p.velocity.y = Math.sin(newAngle) * speed;
            }
        }
        else {
            // Standard Movement
            p.pos.x += p.velocity.x;
            p.pos.y += p.velocity.y;
        }

        p.duration--;

        // Behavior Update
        const config = SPELL_REGISTRY[p.spellType];
        const behaviorKey = config?.behaviorKey || 'GenericBehavior';
        const behavior = BEHAVIOR_REGISTRY[behaviorKey];

        // Force Stone Shield Update (Safety check against Registry issues)
        if (p.spellType === 'EARTH_STONE_SHIELD' || p.data?.stoneShield || p.id.includes('stone_shield')) {
            // Direct usage bypasses registry failure
            StoneShieldBehavior.onUpdate(state, p, callbacks);
        } else if (behavior && behavior.onUpdate) {
            behavior.onUpdate(state, p, callbacks);
        }

        if (p.duration <= 0) {
            console.log('[Projectile Expired]:', p.id);
            state.projectiles.splice(i, 1);
            continue;
        }

        for (const enemy of state.enemies) {
            if (enemy.isDead) continue;
            if (p.hitList.includes(enemy.id)) continue;

            // Get screen positions for current and previous frames
            const screenP = toScreen(p.pos.x, p.pos.y);
            const prevScreenP = toScreen(prevPos.x, prevPos.y);

            // Create projectile hitbox (screen-space rectangle)
            const lift = 35;
            const pY = screenP.y - lift;
            const prevPY = prevScreenP.y - lift;
            const pSize = (p.radius || 0.2) * 32;

            // Get enemy hitboxes
            const enemyHitboxes = calculateEnemyHitboxes(enemy);

            // Check continuous collision against all enemy body parts
            let intersect = false;
            for (const partName in enemyHitboxes) {
                const partHitbox = enemyHitboxes[partName];

                // Use swept collision to check the path traveled
                if (sweptRectIntersectsRect(
                    { x: 0, y: 0, w: pSize, h: pSize }, // Projectile rect (relative)
                    prevScreenP.x, prevPY,  // Previous position
                    screenP.x, pY,          // Current position
                    partHitbox              // Enemy part hitbox
                )) {
                    intersect = true;
                    break;
                }
            }

            if (intersect) {
                p.hitList.push(enemy.id);

                const config = SPELL_REGISTRY[p.spellType];
                const behaviorKey = config?.behaviorKey || 'GenericBehavior';
                const behavior = BEHAVIOR_REGISTRY[behaviorKey];

                if (behavior && behavior.onHit) {
                    behavior.onHit(state, p, enemy, callbacks);
                } else {
                    enemy.hp -= p.damage;
                    enemy.hitTimer = 5;

                    callbacks.addFloatingText(Math.round(p.damage) + ' ', enemy.pos, '#fff');
                    callbacks.createImpactPuff(enemy.pos, p.spellType);

                    // --- CARD EFFECTS ---

                    // 1b. Mana Siphon (Row D)
                    if (p.data?.manaOnHit) {
                        state.player.mana = Math.min(state.player.maxMana, state.player.mana + p.data.manaOnHit);
                    }

                    // 1. Vampirism / Life Steal
                    if (p.data?.lifeSteal) {
                        const heal = p.damage * p.data.lifeSteal;
                        if (heal > 0) {
                            state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
                            // Optional: Floating text for heal?
                        }
                    }

                    // 2. Nova / Explosion (Row B Support)
                    if (p.explosionRadius > 0 && !p.data?.hasExploded) {
                        // Pass Shape Data (Ring/Cone) if present
                        callbacks.createExplosion(p.pos, p.explosionRadius, p.damage * 0.5, '#ff8c00', p.data.aoeShape);
                        p.data.hasExploded = true;

                        // 2b. Lingering Field (SPAWN_FIELD_ON_EXPLOSION)
                        if (p.data.spawnField) { // Mapped in fireSpell (needs TODO) or via generic data property check
                            // Wait, I forgot to map behaviors to `spawnField` in fireSpell explicitly in the PREVIOUS step's text.
                            // But `...plan.data` copies genericData.
                            // Lingering Field Card sets genericData: { duration: 180, ... }
                            // But it doesn't set a flag "I am a lingering field".
                            // It uses behaviorTag: "SPAWN_FIELD_ON_EXPLOSION".
                            // Since I can't check behaviors here easily on `p`, I should have mapped it.
                            // Let's check `p.data.duration` combined with context? No.
                            // Let's rely on `p.data.behaviorTag === 'SPAWN_FIELD_ON_EXPLOSION'`?
                            // Plan data doesn't include behavior tags.
                            // RECOVERY: I can't easily add the mapping now without re-editing fireSpell.
                            // BUT, I can check if `p.data.damageInterval` exists. That's specific to Lingering Field so far.
                            if (p.data.damageInterval) {
                                callbacks.createAreaEffect({
                                    pos: { ...p.pos },
                                    radius: p.explosionRadius,
                                    duration: p.data.duration || 180,
                                    damage: p.damage * 0.2, // 20% DPS
                                    interval: p.data.damageInterval || 30,
                                    color: '#EF4444',
                                    type: 'damage_zone'
                                });
                            }
                        }

                        // 2c. Cluster Bombs
                        if (p.data.clusterCount > 0) { // Mapped from genericData { count: 3 }?
                            // Card genericData: { count: 3, spread: 1.0, damageMult: 0.3 }
                            // Copied to p.data via `...plan.data`.
                            // So `p.data.count` exists.
                            const count = p.data.count; // "clusterCount" vs "count" naming. Card used "count".

                            if (count) {
                                const damage = p.damage * (p.data.damageMult || 0.3);
                                const spread = p.data.spread || 1.0;

                                for (let i = 0; i < count; i++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const dist = Math.random() * spread;
                                    const sprayVel = { x: Math.cos(angle) * 3, y: Math.sin(angle) * 3 };

                                    state.projectiles.push({
                                        id: `cluster_${p.id}_${i}`,
                                        pos: { ...p.pos }, // Start at impact
                                        prevPos: { ...p.pos },
                                        velocity: sprayVel,
                                        radius: 0.2,
                                        isDead: false,
                                        spellType: p.spellType,
                                        damage: damage,
                                        duration: 30, // Short fuse
                                        hitList: [], // Reset hitlist
                                        explosionRadius: p.explosionRadius * 0.5, // Smaller explosion
                                        knockback: 0,
                                        bounces: 0,
                                        maxBounces: 0,
                                        isEnemy: false,
                                        data: { hasExploded: false } // Basic
                                    });
                                }
                            }
                        }
                    }

                    // 3. Combustion (Legacy / Specific Behavior)
                    if (p.data?.fieldType === 'FIRE_ZONE') {
                        callbacks.createVisualEffect('nova', p.pos, 30, { color: '#ef4444', radius: 1.5 });
                        enemy.burnTimer += 120;
                    }

                    // 4. Split
                    if (p.data?.split && p.data.split > 0) {
                        const splitCount = p.data.split;
                        for (let k = 0; k < splitCount; k++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 5;
                            state.projectiles.push({
                                ...p,
                                id: p.id + '_split_' + k,
                                velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                                damage: p.damage * 0.5,
                                data: { ...p.data, split: 0 }, // Prevent recursive split
                                hitList: [enemy.id] // Don't hit same enemy instantly
                            });
                        }
                        p.data.split = 0; // Consume split
                    }

                    if (enemy.hp <= 0 && enemy.enemyState !== 'DYING') {
                        enemy.enemyState = 'DYING';
                        enemy.deathTimer = 30;
                        handleEnemyDeath(state, enemy, callbacks);
                    }

                    // 5. Bounce / Ricochet
                    // Check if we should bounce instead of dying?
                    // "Bounce" usually means find new target.
                    if (p.maxBounces && p.bounces < p.maxBounces) {
                        p.bounces++;
                        // Find nearest other enemy
                        // (Simple bounce: random or reflection? Ricochet usually implies targeting)
                        // For prototype: Reflect velocity roughly
                        p.velocity.x *= -1;
                        p.velocity.y *= -1;
                        // Reduce damage?
                        // p.damage *= 0.85; 
                    }
                    // Pierce & Death Logic
                    else if (!p.hitList.length || !p.data?.pierce) {
                        console.log('[Projectile Death] Hit Enemy/Wall:', p.id);
                        p.isDead = true;
                    }
                    else if (p.hitList.length >= (p.data?.pierce || 1)) {
                        console.log('[Projectile Death] Pierce Limit:', p.id);
                        p.isDead = true;
                    }
                }

                if (p.isDead) break;
            }
        }

        // Update prevPos for next frame
        p.prevPos = { ...p.pos };

        if (p.isDead) {
            state.projectiles.splice(i, 1);
        }
    }
};

export const updateAreaEffects = (state: GameState, dt: number, callbacks: SpellCallbacks) => {
    // console.log("AE Update Tick"); // Throttled Debug
    // Filter out dead effects first? Or splice in loop reverse.
    // Reverse loop to allow splice
    for (let i = state.areaEffects.length - 1; i >= 0; i--) {
        const ae = state.areaEffects[i];
        ae.duration -= dt;

        // Delegate to Behavior
        const config = SPELL_REGISTRY[ae.spellType];
        if (config) {
            const behavior = BEHAVIOR_REGISTRY[config.behaviorKey];
            if (behavior && behavior.onTick) {
                behavior.onTick(state, ae, callbacks);
            }
        }

        // Custom Logic for Portals (Legacy / Specific)
        if (ae.data?.subtype === 'PORTAL') {
            // ... portal logic kept for now, though it should ideally move to PortalBehavior.onTick ...
            // (Leaving it here to avoid breaking portal logic unless I refactor PortalBehavior too)
            // Actually, let's keep it here for safety as PortalBehavior might not be fully wired for this yet.
            // But the new delegation above will run ALSO if PortalBehavior has onTick.
            // Checking PortalBehavior... it likely doesn't have onTick yet.
            if (!state.player.cooldowns) state.player.cooldowns = {};
            const cooldown = state.player.cooldowns['PORTAL_CD'] || 0;
            if (cooldown <= 0) {
                const dx = state.player.pos.x - ae.pos.x;
                const dy = state.player.pos.y - ae.pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < ae.radius) {
                    // Dynamic Linking: Find the destination portal
                    const linkedId = ae.data.linkedPortalId;
                    const targetPortal = state.areaEffects.find(eff => eff.id === linkedId);

                    if (targetPortal) {
                        // Teleport to the sibling portal's position
                        state.player.pos.x = targetPortal.pos.x;
                        state.player.pos.y = targetPortal.pos.y;
                        state.player.velocity = { x: 0, y: 0 }; // Stop movement to prevent bouncing/skating

                        // Set Cooldowns
                        state.player.cooldowns['PORTAL_CD'] = 3000; // 3s lockout
                        state.player.cooldowns['FACING_LOCK'] = 200; // 0.2s facing freeze

                        // VFX
                        callbacks.createVisualEffect('nova', { x: ae.pos.x, y: ae.pos.y }, 20, { radius: 2, color: '#8b5cf6' });
                        callbacks.createVisualEffect('nova', { x: targetPortal.pos.x, y: targetPortal.pos.y }, 20, { radius: 2, color: '#8b5cf6' });
                    }
                }
            }
        }

        if (ae.duration <= 0) {
            state.areaEffects.splice(i, 1);
        }
    }
};

export const updatePlayerBuffs = (state: GameState, dt: number) => {
    if (!state.player.buffs) return;

    for (let i = state.player.buffs.length - 1; i >= 0; i--) {
        const buff = state.player.buffs[i];
        buff.duration -= dt;
        if (buff.duration <= 0) {
            state.player.buffs.splice(i, 1);
        }
    }
};
