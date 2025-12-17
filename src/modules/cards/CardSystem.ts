import { SpellDefinition } from "../spells/SpellRegistry";
import { Player, Vector2 } from "../../types";
import { CardInstance, CardContext, CastPlan, Stats, SpellKind, SpellKey, BehaviorFlag } from "./types";
import { CARD_REGISTRY } from "./CardRegistry";

// Default / Empty stats
const DEFAULT_STATS: Stats = {
    damageMult: 1.0,
    cooldownMult: 1.0, // Base mod is 1.0 (no change). Cards add/subtract from this.
    manaCostMult: 1.0,
    castTimeMult: 1.0,
    projectileCount: 0, // Additive field
    projectileSpeedMult: 1.0,
    projectileScale: 1.0,
    spreadDegrees: 0,
    aoeRadiusMult: 1.0,
    durationMult: 1.0,
    pierceCount: 0,
    bounceCount: 0,
    splitCount: 0,
    homingStrength: 0,
    lifeSteal: 0,
    critChanceFlat: 0,
    critMultFlat: 0,
    knockbackForce: 0,
    manaOnHit: 0,
    shieldOnCast: 0,
    gravityForce: 0,
    selfDamageOnCast: 0
};

// Helper: Map old string spellType to strict SpellKind
const mapSpellKind = (type: string): SpellKind => {
    const t = type.toUpperCase();
    if (t === 'PROJECTILE') return 'PROJECTILE';
    if (t === 'AOE') return 'AOE';
    if (t === 'BEAM') return 'BEAM';
    if (t === 'DASH') return 'DASH';
    if (t === 'SUMMON') return 'SUMMON';
    if (t === 'UTILITY') return 'UTILITY';
    if (t === 'MELEE') return 'MELEE';
    return 'PROJECTILE'; // Fallback
};

// 5. Conflict Resolution Table
const FLAG_CONFLICTS: Partial<Record<BehaviorFlag, BehaviorFlag[]>> = {
    BEAM: ['SPLIT_ON_IMPACT', 'ORBIT_CASTER', 'HOMING', 'NO_EXPLOSION_ON_PASS'],
    ORBIT_CASTER: ['BEAM', 'HOMING'],
    HOMING: ['BEAM'],
    AOE_SHAPE_RING: ['AOE_SHAPE_CONE'],
    AOE_SHAPE_CONE: ['AOE_SHAPE_RING']
};

/**
 * Creates the initial CastPlan based on the SpellDefinition and Player state.
 */
export const createDefaultCastPlan = (
    spell: SpellDefinition,
    player: Player,
    targetPos: Vector2,
    context: CardContext
): CastPlan => {

    const kind = mapSpellKind(spell.spellType);

    // 1. Initialize from Base Stats
    const stats: Stats = { ...DEFAULT_STATS };

    // Map base config to stats
    stats.projectileCount = spell.geometry?.projectileCount || 1;
    stats.pierceCount = spell.targeting?.maxPenetrations || 0;

    // 2. Apply Player Talents (Legacy support or simple hooks here)
    if (spell.school === 'FIRE' && player.spellTalents?.FIRE?.multiFlare) {
        stats.projectileCount += player.spellTalents.FIRE.multiFlare;
    }

    // 3. Create Plan
    return {
        spellKey: spell.spellKey as SpellKey,
        kind: kind,
        tags: [spell.school], // Init with School tag
        stats: stats,
        buffs: {},
        transform: null,
        flags: [],
        triggers: [],
        data: {
            ...spell.data,
            ...spell.balance // Flatten balance into data for easy access
        },
        casterId: player.id,
        targetPos: targetPos
    };
};


/**
 * Helper to safely add additive mods from 0 (count, degrees etc)
 */
const add = (a: number | undefined, b: number) => (a ?? 0) + b;

/**
 * Helper to safely add additive mods from a base of 1.0 (multipliers)
 */
const addFrom1 = (a: number | undefined, b: number) => (a ?? 1.0) + b;

/**
 * Helper to clamp values
 */
const clamp01 = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Normalizes stats to prevent game-breaking values
 */
const normalizeStats = (s: Stats) => {
    // Clamping Multipliers
    s.damageMult = clamp01(s.damageMult ?? 1, 0.1, 50);
    s.cooldownMult = clamp01(s.cooldownMult ?? 1, 0.1, 10);
    s.manaCostMult = clamp01(s.manaCostMult ?? 1, 0.1, 10); // Min 0.1 cost
    s.castTimeMult = clamp01(s.castTimeMult ?? 1, 0.1, 10);

    // Projectile & AoE
    s.projectileSpeedMult = clamp01(s.projectileSpeedMult ?? 1, 0.1, 10);
    s.aoeRadiusMult = clamp01(s.aoeRadiusMult ?? 1, 0.1, 10);
    s.durationMult = clamp01(s.durationMult ?? 1, 0.1, 10); // Min duration 10%

    // Counts (Int check usually done at consumption, but simple clamp here)
    if (s.projectileCount !== undefined && s.projectileCount < 1) s.projectileCount = 1;
    if (s.pierceCount !== undefined && s.pierceCount < 0) s.pierceCount = 0;
    if (s.bounceCount !== undefined && s.bounceCount < 0) s.bounceCount = 0;
    if (s.splitCount !== undefined && s.splitCount < 0) s.splitCount = 0;
};


const applyStats = (t: Stats, m: Partial<Stats>) => {
    // 3. Fix: Logic checks for !== undefined to catch 0 and negative values

    // Counts & Integers (Additive from current)
    if (m.projectileCount !== undefined) t.projectileCount = add(t.projectileCount, m.projectileCount);
    if (m.pierceCount !== undefined) t.pierceCount = add(t.pierceCount, m.pierceCount);
    if (m.bounceCount !== undefined) t.bounceCount = add(t.bounceCount, m.bounceCount);
    if (m.splitCount !== undefined) t.splitCount = add(t.splitCount, m.splitCount);
    if (m.spreadDegrees !== undefined) t.spreadDegrees = add(t.spreadDegrees, m.spreadDegrees);

    // Multipliers (Additive from Base 1.0)
    // E.g. damageMult = 1.0 + (-0.2) = 0.8
    if (m.damageMult !== undefined) t.damageMult = addFrom1(t.damageMult, m.damageMult);
    if (m.cooldownMult !== undefined) t.cooldownMult = addFrom1(t.cooldownMult, m.cooldownMult);
    if (m.manaCostMult !== undefined) t.manaCostMult = addFrom1(t.manaCostMult, m.manaCostMult);
    if (m.castTimeMult !== undefined) t.castTimeMult = addFrom1(t.castTimeMult, m.castTimeMult);
    if (m.projectileSpeedMult !== undefined) t.projectileSpeedMult = addFrom1(t.projectileSpeedMult, m.projectileSpeedMult);
    if (m.aoeRadiusMult !== undefined) t.aoeRadiusMult = addFrom1(t.aoeRadiusMult, m.aoeRadiusMult);
    if (m.durationMult !== undefined) t.durationMult = addFrom1(t.durationMult, m.durationMult);

    if (m.homingStrength !== undefined) t.homingStrength = add(t.homingStrength, m.homingStrength);

    // Scale is Multiplicative Stacking (User feedback choice)
    if (m.projectileScale !== undefined) t.projectileScale = (t.projectileScale ?? 1) * m.projectileScale;

    // Setters
    if (m.orbitRadius !== undefined) t.orbitRadius = m.orbitRadius;
    if (m.orbitSpeed !== undefined) t.orbitSpeed = m.orbitSpeed;

    // Misc Additives
    if (m.manaOnHit !== undefined) t.manaOnHit = add(t.manaOnHit, m.manaOnHit);
    if (m.shieldOnCast !== undefined) t.shieldOnCast = add(t.shieldOnCast, m.shieldOnCast);
    if (m.gravityForce !== undefined) t.gravityForce = add(t.gravityForce, m.gravityForce);
    if (m.selfDamageOnCast !== undefined) t.selfDamageOnCast = add(t.selfDamageOnCast, m.selfDamageOnCast);

    // Crit
    if (m.critChanceFlat !== undefined) t.critChanceFlat = add(t.critChanceFlat, m.critChanceFlat);
    if (m.critMultFlat !== undefined) t.critMultFlat = add(t.critMultFlat, m.critMultFlat);
    if (m.knockbackForce !== undefined) t.knockbackForce = add(t.knockbackForce, m.knockbackForce);

    if (m.lifeSteal !== undefined) t.lifeSteal = add(t.lifeSteal, m.lifeSteal);
};

const applyFlag = (flags: BehaviorFlag[], f: BehaviorFlag) => {
    // 5. Fix: Conflict Resolution
    const conflicts = FLAG_CONFLICTS[f] ?? [];
    for (const c of conflicts) {
        const idx = flags.indexOf(c);
        if (idx !== -1) flags.splice(idx, 1);
    }
    if (!flags.includes(f)) flags.push(f);
};

/**
 * Pure function to apply a list of cards to a CastPlan.
 * SAFE: Uses try-catch and null checks to prevent crashes.
 */
export const applyCardsToCastPlan = (
    plan: CastPlan,
    cards: CardInstance[],
    context: CardContext
): CastPlan => {

    // Clone plan to ensure purity
    const newPlan: CastPlan = {
        ...plan,
        stats: { ...plan.stats },
        buffs: { ...plan.buffs },
        transform: plan.transform ? { ...plan.transform } : null,
        flags: [...plan.flags],
        triggers: [...plan.triggers],
        data: { ...plan.data, triggerBudget: { maxProcsPerSecond: 10, maxTriggers: 8 } } // 6. Fix: Init Trigger Budget
    };

    try {
        for (const cardInst of cards) {
            const def = CARD_REGISTRY[cardInst.cardId];

            // 1. Safety Check: Registry Existence
            if (!def) {
                console.warn(`Card definition not found for id: ${cardInst.cardId}. Skipping.`);
                continue;
            }

            // 4. Fix: Any-Kind Requirements
            if (def.requires?.kinds?.length) {
                if (!def.requires.kinds.includes(newPlan.kind)) {
                    // Check if it's strictly ANY for compatibility
                    // If card requires ['PROJECTILE'] but spell is 'BEAM', skip.
                    continue;
                }
            }

            // Check Tags
            if (def.requires?.tags?.length) {
                // If spell matches ANY of the required tags? Or ALL? Usually ALL for strict reqs, or ANY?
                // "requires: { tags: ['FIRE'] }" usually means "Must be Fire".
                const hasRequiredTag = def.requires.tags.some(t => newPlan.tags.includes(t));
                if (!hasRequiredTag) continue;
            }

            // 3. Apply Grants
            if (def.grants) {
                // Apply Stats
                if (def.grants.stats) {
                    applyStats(newPlan.stats, def.grants.stats);
                }

                // Apply Flags with Conflict Resolution
                if (def.grants.flags) {
                    for (const f of def.grants.flags) {
                        applyFlag(newPlan.flags, f);
                    }
                }

                // Apply Buffs
                if (def.grants.buffs) {
                    Object.assign(newPlan.buffs, def.grants.buffs);
                }

                // Apply Triggers with Budget Check
                if (def.grants.triggers) {
                    for (const tr of def.grants.triggers) {
                        // 6. Fix: Enforce Plan Budget
                        if (newPlan.triggers.length >= (newPlan.data.triggerBudget?.maxTriggers ?? 8)) break;
                        newPlan.triggers.push(tr);
                    }
                }

                // Apply Transform (Last one wins policy for now)
                if (def.grants.transform) {
                    newPlan.transform = { ...def.grants.transform };
                }
            }

            // 4. Apply Tradeoffs
            if (def.tradeoffs?.stats) {
                applyStats(newPlan.stats, def.tradeoffs.stats);
            }
        }
    } catch (e) {
        console.error("Critical Error in applyCardsToCastPlan:", e);
    }

    // 1. Fix: Normalize stats (Clamp)
    normalizeStats(newPlan.stats);

    return newPlan;
};

/**
 * Validates if a card can be equipped into a spell slot.
 */
export const validateCardForSpell = (card: import("./types").CardDefinition, spell: SpellDefinition): boolean => {
    // Check Kind Requirement
    const kind = mapSpellKind(spell.spellType);

    if (card.requires?.kinds?.length) {
        if (!card.requires.kinds.includes(kind)) {
            return false;
        }
    }

    // Check School/Tags
    if (card.requires?.tags) {
        if (!card.requires.tags.includes(spell.school)) {
            return false;
        }
    }

    return true;
};
