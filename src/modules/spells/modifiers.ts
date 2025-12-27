import { Vector2 } from "../../types";

// --- REUSED TYPES FROM CARDS (Consolidating) ---
// Ideally we import these from a shared location, but for the refactor we are defining the "Source of Truth" here.
// We will deprecate cards/types.ts later or alias them.

export type SpellKey = string;

export type BehaviorFlag =
    | 'ORBIT_CASTER'
    | 'HOMING'
    | 'BEAM'
    | 'CHARGE_UP'
    | 'MULTI_CAST'
    | 'DELAYED_CAST'
    | 'DELAYED_PULSE'
    | 'CONSUME_STATUS'
    | 'DASH_ON_CAST'
    | 'TELEPORT_ON_END'
    | 'MOVE_SPEED_WHILE_CASTING'
    | 'VACUUM'
    | 'KNOCKBACK'
    | 'COST_HP'
    | 'DAMAGE_BOOST_SELF_STUN'
    | 'REDUCE_DEFENSE'
    | 'RANDOM_EFFECTS'
    | 'NO_EXPLOSION_ON_PASS'
    | 'SPLIT_ON_IMPACT'
    | 'EXPLODE_ON_DEATH'
    | 'SPAWN_FIELD_ON_IMPACT'
    | 'SECONDARY_EXPLOSION'
    | 'AOE_SHAPE_RING'
    | 'AOE_SHAPE_CONE'
    | 'SPAWN_FIELD_ON_EXPLOSION'
    | 'CLUSTER_BOMBS'
    | 'BURST_CAST'
    | 'SPELL_ECHO'
    | 'REDUCE_MAX_HP'
    | 'PIERCE_OBSTACLES'
    | 'CHAIN_LIGHTNING'

    | 'FREEZE_ON_HIT'
    | 'CONE_AOE'
    | 'ORIGIN_OFFSET'
    | 'ALLOW_HIGH_VOLTAGE';

export interface StatMods {
    // Multipliers (1.0 = base)
    damageMult?: number;
    cooldownMult?: number;
    manaCostMult?: number;
    castTimeMult?: number;
    projectileSpeedMult?: number;
    aoeRadiusMult?: number;
    durationMult?: number;

    // Flat Additions
    projectileCount?: number;
    pierceCount?: number;
    bounceCount?: number;
    splitCount?: number;
    chainCount?: number;

    // Mechanics
    spreadDegrees?: number;
    homingStrength?: number;
    orbitRadius?: number;
    orbitSpeed?: number;
    lifeSteal?: number;
    critChanceFlat?: number;
    critMultFlat?: number;
    knockbackForce?: number;
    manaOnHit?: number;
    shieldOnCast?: number;
    gravityForce?: number;
    selfDamageOnCast?: number;

    // Status Application
    burnStacks?: number;
    chillStacks?: number;
    shockStacks?: number;
    bleedStacks?: number;
    swiftnessFlat?: number; // Added for player-affecting talents

    // Special
    projectileScale?: number;
    explosionRadiusFlat?: number; // Added
    morph?: 'NONE' | 'WOLF' | 'BEAR' | 'SHADOW'; // Added

    // Legacy / Flags mapped to Stats for simplicity if needed
    useHealthCost?: boolean;

    // Buff Durations (Seconds) - Mapped from BuffMods for easier consumption in SpellSystem
    buffStoneskin?: number;
    buffThorns?: number;
    buffDeflection?: number;
}

export interface BuffMods {
    stoneskin?: { duration: number; armorFlat?: number; armorMult?: number };
    thorns?: { duration: number; reflectMult: number };
    deflection?: { duration: number; dodgeMult: number };
    vampirism?: { lifestealMult: number };
}

export interface TransformMod {
    form: 'WOLF' | 'BEAR' | 'SHADOW';
    duration?: number;
    moveset?: string;
}

export interface TriggerRule {
    when: 'ON_HIT' | 'ON_KILL' | 'ON_CRIT' | 'ON_CAST' | 'ON_EXPIRE';
    effect: {
        type: 'AFTERSHOCK' | 'ECHO' | 'CONSUME_STATUS' | 'HEAL_PCT' | 'SPAWN_FIELD' | 'DETONATE';
        data?: Record<string, any>
    };
    value?: number;
    chance?: number; // 0-1
}

export interface BehaviorPatch {
    type: 'OVERRIDE_BEHAVIOR' | 'ADD_TRAIL' | 'CHANGE_PROJECTILE' | 'MODIFY_TARGETING';
    data: any;
}

// --- THE UNIFIED CONTRACT ---
export interface UnifiedModifier {
    id: string; // "talent_checkmate" or "card_abc123"
    source: 'TALENT' | 'CARD' | 'ITEM' | 'BASE';

    stats?: StatMods;
    flags?: BehaviorFlag[];
    triggers?: TriggerRule[];
    buffs?: BuffMods;
    transform?: TransformMod;
    data?: any; // Generic bucket for behavior-specific variables (e.g., stoneShield hitsRemaining)

    // Advanced: Patches that change how the spell works fundamentally
    behaviorPatches?: BehaviorPatch[];

    // Hooks: Logic to run at specific times (implemented as strings mapping to registry functions)
    hooks?: {
        onCast?: string;
        onHit?: string;
        onTick?: string;
    };
}
