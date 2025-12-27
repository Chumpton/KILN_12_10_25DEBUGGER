import { Vector2 } from "../../types";

// --- CORE IDENTITY TYPES ---
export type SpellKey = string; // e.g. "FIREBALL", "FROSTBOLT"

export type SpellKind =
    | 'PROJECTILE'
    | 'BEAM'
    | 'AOE'
    | 'MELEE'
    | 'DASH'
    | 'SUMMON'
    | 'TRANSFORM'
    | 'UTILITY';

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
    | 'REDUCE_MAX_HP';

// --- DATA DOMAINS ---

export interface Stats {
    damageMult: number;
    cooldownMult: number;
    manaCostMult: number;
    castTimeMult: number;

    projectileCount?: number;
    projectileSpeedMult?: number;
    projectileScale?: number; // Renamed from projectileScaleMult for consistency with existing code if needed, but let's stick to user spec "projectileScaleMult" or just "projectileScale" (existing was projectileScale). User spec said projectileScaleMult. Let's use projectileScaleMult to be precise. Actually, looking at code, it uses projectileScale. Let's stick to projectileScale for now to minimize friction or update logical usage. User said "projectileScaleMult". I will use projectileScaleMult and update logic.
    spreadDegrees?: number;

    aoeRadiusMult?: number;
    durationMult?: number;

    pierceCount?: number;
    bounceCount?: number;
    splitCount?: number;

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
    explosionRadiusFlat?: number;
    useHealthCost?: boolean;
    buffStoneskin?: number;
    buffThorns?: number;
    buffDeflection?: number;
    morph?: string;
}

export interface Buffs {
    stoneskin?: { duration: number; armorFlat?: number; armorMult?: number };
    thorns?: { duration: number; reflectMult: number };
    deflection?: { duration: number; dodgeMult: number };
    vampirism?: { lifestealMult: number };
}

export interface Transform {
    form: 'WOLF' | 'BEAR' | 'SHADOW';
    duration?: number; // If 0/undefined, assumes permanent until toggled? Or spell duration?
    moveset?: string;
}

export interface TriggerRule {
    when: 'ON_HIT' | 'ON_KILL' | 'ON_CRIT';
    effect: {
        type: 'AFTERSHOCK' | 'ECHO' | 'CONSUME_STATUS' | 'HEAL_PCT' | 'SPAWN_FIELD';
        data?: Record<string, any>
    };
    value?: number; // Generic value field
}

// --- CAST PLAN (THE TRUTH) ---

export interface CastPlan {
    spellKey: SpellKey;
    kind: SpellKind;
    tags: string[];              // ['FIRE','ICE','LIGHTNING',...]

    // The Domains
    stats: Stats;
    buffs: Buffs;
    transform: Transform | null;

    flags: BehaviorFlag[];       // Serializable strings
    triggers: TriggerRule[];

    data: Record<string, any>;   // Runtime-only / Escape hatch

    casterId: string;
    targetPos: Vector2;
}

// --- CARD DEFINITIONS ---

export type CardType = 'STAT_MOD' | 'FLAG' | 'TRIGGER' | 'TRANSFORM' | 'BUFF' | 'HYBRID';

export interface CardDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
    cost: number;

    type: CardType;

    // Requirements to equip
    requires?: {
        kinds?: SpellKind[];
        tags?: string[];
        notKinds?: SpellKind[];
    };

    // What it does
    grants?: {
        stats?: Partial<Stats>;
        flags?: BehaviorFlag[];
        triggers?: TriggerRule[];
        transform?: Transform;
        buffs?: Partial<Buffs>;
    };

    // Tradeoffs (negative stats)
    tradeoffs?: {
        stats?: Partial<Stats>;
    };

    // Legacy support (to be removed, but helpful for migration if we kept it, but we are refactoring hard so NO.)
}

export interface CardInstance {
    instanceId: string;
    cardId: string;
    gridX?: number;
    gridY?: number;
}

export interface CardContext {
    playerLevel: number;
    spellLevel: number;
    playerStats?: {
        maxHp: number;
        maxMana: number;
        power: number;
        critChance: number;
        moveSpeed: number;
        armor: number;
    };
    spellKind?: SpellKind;
    spellTags?: string[];
}
