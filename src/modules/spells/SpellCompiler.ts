import { SpellType, SpellDefinition, Player } from "../../types";
import { SPELL_REGISTRY } from "./SpellRegistry";
import { UnifiedModifier, StatMods, UnifiedModifier as Mod } from "./modifiers";
import { CastPlan, CardContext } from "../cards/types"; // We will update CastPlan to use new types later, for now we map
import { FEATURE_FLAGS } from "../../constants";
import { CARD_REGISTRY } from "../cards/CardRegistry";
import { TALENT_REGISTRY } from "../talents/TalentRegistry";

// Helper to merge stats additively/multiplicatively
const mergeStats = (base: any, mod: StatMods) => {
    const out = { ...base };

    // Multipliers
    if (mod.damageMult) out.damageMult = (out.damageMult || 1) * mod.damageMult;
    if (mod.cooldownMult) out.cooldownMult = (out.cooldownMult || 1) * mod.cooldownMult;
    if (mod.manaCostMult) out.manaCostMult = (out.manaCostMult || 1) * mod.manaCostMult;
    if (mod.castTimeMult) out.castTimeMult = (out.castTimeMult || 1) * mod.castTimeMult;
    if (mod.projectileSpeedMult) out.projectileSpeedMult = (out.projectileSpeedMult || 1) * mod.projectileSpeedMult;
    if (mod.aoeRadiusMult) out.aoeRadiusMult = (out.aoeRadiusMult || 1) * mod.aoeRadiusMult;
    if (mod.durationMult) out.durationMult = (out.durationMult || 1) * mod.durationMult;

    // Flat Adds
    if (mod.projectileCount) out.projectileCount = (out.projectileCount || 0) + mod.projectileCount;
    if (mod.pierceCount) out.pierceCount = (out.pierceCount || 0) + mod.pierceCount;
    if (mod.bounceCount) out.bounceCount = (out.bounceCount || 0) + mod.bounceCount;
    if (mod.splitCount) out.splitCount = (out.splitCount || 0) + mod.splitCount;
    if (mod.chainCount) out.chainCount = (out.chainCount || 0) + mod.chainCount;
    if (mod.burnStacks) out.burnStacks = (out.burnStacks || 0) + mod.burnStacks;
    if (mod.chillStacks) out.chillStacks = (out.chillStacks || 0) + mod.chillStacks;
    if (mod.shockStacks) out.shockStacks = (out.shockStacks || 0) + mod.shockStacks;

    // Max/Assigns
    if (mod.spreadDegrees) out.spreadDegrees = Math.max(out.spreadDegrees || 0, mod.spreadDegrees);
    if (mod.homingStrength) out.homingStrength = (out.homingStrength || 0) + mod.homingStrength;
    if (mod.orbitRadius) out.orbitRadius = mod.orbitRadius; // Usually override
    if (mod.orbitSpeed) out.orbitSpeed = mod.orbitSpeed;
    if (mod.lifeSteal) out.lifeSteal = (out.lifeSteal || 0) + mod.lifeSteal;
    if (mod.critChanceFlat) out.critChanceFlat = (out.critChanceFlat || 0) + mod.critChanceFlat;
    if (mod.critMultFlat) out.critMultFlat = (out.critMultFlat || 0) + mod.critMultFlat;
    if (mod.knockbackForce) out.knockbackForce = (out.knockbackForce || 0) + mod.knockbackForce;
    if (mod.manaOnHit) out.manaOnHit = (out.manaOnHit || 0) + mod.manaOnHit;
    if (mod.shieldOnCast) out.shieldOnCast = (out.shieldOnCast || 0) + mod.shieldOnCast;
    if (mod.gravityForce) out.gravityForce = (out.gravityForce || 0) + mod.gravityForce;
    if (mod.selfDamageOnCast) out.selfDamageOnCast = (out.selfDamageOnCast || 0) + mod.selfDamageOnCast;
    if (mod.projectileScale) out.projectileScale = (out.projectileScale || 1) * mod.projectileScale;

    return out;
};

export const compileSpellPlan = (
    spellKey: SpellType,
    player: Player,
    targetInfo: { pos: { x: number, y: number } },
    context: CardContext
): CastPlan => {

    // 1. Load Definition
    const def = SPELL_REGISTRY[spellKey];
    if (!def) {
        throw new Error(`Spell Definition not found for ${spellKey}`);
    }

    // 2. Initialize Base Plan
    let plan: CastPlan = {
        spellKey: spellKey as string,
        kind: def.spellType.toUpperCase() as any, // Mapping 'Projectile' -> 'PROJECTILE'
        tags: def.resource.tags || [],
        casterId: player.id,
        targetPos: targetInfo.pos,

        stats: {
            damageMult: 1,
            cooldownMult: 1,
            manaCostMult: 1,
            castTimeMult: 1,
            projectileCount: def.geometry.projectileCount,
            projectileSpeedMult: 1,
            projectileScale: 1,
            spreadDegrees: def.geometry.projectileSpreadDegrees,
            aoeRadiusMult: 1,
            durationMult: 1,
            pierceCount: def.targeting.maxPenetrations,
            bounceCount: def.geometry.maxRicochets || 0,
            splitCount: 0,
            homingStrength: def.geometry.homingStrength,
            orbitRadius: def.geometry.orbitRadius,
            lifeSteal: 0,
            knockbackForce: 0
        },
        buffs: {},
        transform: null,
        flags: [],
        triggers: [],
        data: { ...def.data }
    };

    // 3. Collect Modifiers
    const modifiers: UnifiedModifier[] = [];

    // A. Talents (If Flags enabled)
    if (FEATURE_FLAGS.USE_TALENTS && player.spellTalents?.allocations) {
        const spellTalents = TALENT_REGISTRY[spellKey];
        if (spellTalents) {
            spellTalents.forEach((talent: any) => {
                const rank = player.spellTalents.allocations[`${spellKey}:${talent.id}`] || 0;
                if (rank > 0) {
                    const mod = talent.grants(rank);
                    modifiers.push({
                        id: `talent_${talent.id}`,
                        source: 'TALENT',
                        ...mod
                    } as UnifiedModifier);
                }
            });
        }

        // B. UP-TICKS (Direct Stat Masteries)
        const allocations = player.spellTalents.allocations;
        const damageRank = allocations[`${spellKey}:uptick:damage`] || 0;
        if (damageRank > 0) plan.stats.damageMult *= (1 + (damageRank * 0.06));

        const castSpeedRank = allocations[`${spellKey}:uptick:cast_speed`] || 0;
        if (castSpeedRank > 0) plan.stats.castTimeMult *= (1 + (castSpeedRank * -0.04));

        const projSpeedRank = allocations[`${spellKey}:uptick:proj_speed`] || 0;
        if (projSpeedRank > 0) plan.stats.projectileSpeedMult *= (1 + (projSpeedRank * 0.06));

        const burnPotencyRank = allocations[`${spellKey}:uptick:burn_potency`] || 0;
        if (burnPotencyRank > 0) {
            plan.data.burnPotencyMult = (plan.data.burnPotencyMult || 1) + (burnPotencyRank * 0.08);
        }
    }

    // B. Cards (Legacy Adapter or New Unified)
    if (player.equippedCards && player.equippedCards[spellKey]) {
        const cards = player.equippedCards[spellKey]!;
        cards.forEach(cardInstance => {
            const cardDef = CARD_REGISTRY[cardInstance.cardId];
            if (cardDef && cardDef.grants) {
                // Map Legacy Card Grants to UnifiedModifier
                const mod: UnifiedModifier = {
                    id: cardInstance.instanceId,
                    source: 'CARD',
                    stats: cardDef.grants.stats as any,
                    flags: cardDef.grants.flags,
                    triggers: cardDef.grants.triggers as any,
                    buffs: cardDef.grants.buffs as any,
                    transform: cardDef.grants.transform
                };
                modifiers.push(mod);
            }
        });
    }

    // 4. Apply Modifiers
    // This serves as the "layering" step
    modifiers.forEach(mod => {
        if (mod.stats) {
            plan.stats = mergeStats(plan.stats, mod.stats);
        }
        if (mod.flags) {
            mod.flags.forEach(f => {
                if (!plan.flags.includes(f as any)) plan.flags.push(f as any);
            });
        }
        if (mod.triggers) {
            plan.triggers.push(...mod.triggers as any);
        }
        if (mod.buffs) {
            plan.buffs = { ...plan.buffs, ...mod.buffs };
        }
        if (mod.transform) {
            plan.transform = mod.transform;
        }
        if (mod.data) {
            plan.data = { ...plan.data, ...mod.data };
        }
    });

    return plan;
};
